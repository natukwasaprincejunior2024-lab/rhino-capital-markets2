import { useMemo, useState, type MouseEvent } from 'react';
import { calculateBollinger, calculateEMA, formatCompact, formatPrice, type Candle } from '@/lib/market-data';

const WIDTH = 1000;
const PRICE_HEIGHT = 280;
const VOLUME_TOP = 300;
const VOLUME_HEIGHT = 60;
const HEIGHT = VOLUME_TOP + VOLUME_HEIGHT;

interface CandleChartProps {
  candles: Candle[];
  decimals: number;
  showEma: boolean;
  showBollinger: boolean;
}

function linePath(values: number[], x: (i: number) => number, y: (v: number) => number): string {
  let d = '';
  values.forEach((v, i) => {
    if (Number.isNaN(v)) return;
    d += `${d ? 'L' : 'M'}${x(i).toFixed(2)},${y(v).toFixed(2)} `;
  });
  return d.trim();
}

export default function CandleChart({ candles, decimals, showEma, showBollinger }: CandleChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const count = candles.length;

  const closes = useMemo(() => candles.map((c) => c.close), [candles]);
  const ema = useMemo(() => calculateEMA(closes, 20), [closes]);
  const bands = useMemo(() => calculateBollinger(closes, 20, 2), [closes]);

  const scale = useMemo(() => {
    let low = Math.min(...candles.map((c) => c.low));
    let high = Math.max(...candles.map((c) => c.high));
    for (const v of [...bands.lower, ...bands.upper]) {
      if (Number.isNaN(v)) continue;
      low = Math.min(low, v);
      high = Math.max(high, v);
    }
    const pad = (high - low) * 0.05 || 1;
    return {
      min: low - pad,
      max: high + pad,
      maxVolume: Math.max(...candles.map((c) => c.volume)),
    };
  }, [candles, bands]);

  const step = WIDTH / count;
  const bodyWidth = Math.max(1.5, step * 0.6);
  const x = (i: number) => step * i + step / 2;
  const y = (p: number) => PRICE_HEIGHT - ((p - scale.min) / (scale.max - scale.min)) * PRICE_HEIGHT;
  const vy = (v: number) => VOLUME_TOP + VOLUME_HEIGHT - (v / scale.maxVolume) * VOLUME_HEIGHT;

  const validBand = candles.map((_, i) => i).filter((i) => !Number.isNaN(bands.upper[i]));
  const upperPoints = validBand.map((i) => `${x(i).toFixed(2)},${y(bands.upper[i]).toFixed(2)}`);
  const lowerPoints = [...validBand].reverse().map((i) => `${x(i).toFixed(2)},${y(bands.lower[i]).toFixed(2)}`);
  const bandPath = validBand.length ? `M${[...upperPoints, ...lowerPoints].join(' L')} Z` : '';

  const gridValues = [0, 1 / 3, 2 / 3, 1].map((f) => scale.max - (scale.max - scale.min) * f);

  const handleMove = (e: MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const index = Math.floor(((e.clientX - rect.left) / rect.width) * count);
    setHover(Math.min(count - 1, Math.max(0, index)));
  };

  const shown = candles[hover ?? count - 1];
  const shownIndex = hover ?? count - 1;

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-5">
        <Readout label="Time" value={new Date(shown.time * 1000).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })} />
        <Readout label="Open" value={formatPrice(shown.open, decimals)} />
        <Readout label="High" value={formatPrice(shown.high, decimals)} />
        <Readout label="Low" value={formatPrice(shown.low, decimals)} />
        <Readout label="Close" value={formatPrice(shown.close, decimals)} tone={shown.close >= shown.open ? 'up' : 'down'} />
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full select-none" role="img" aria-label="Price chart">
        {gridValues.map((v, idx) => (
          <g key={idx}>
            <line x1={0} x2={WIDTH} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} strokeDasharray="4 6" />
            <text x={WIDTH - 6} y={y(v) - 6} textAnchor="end" className="fill-muted" fontSize={14}>
              {formatPrice(v, decimals)}
            </text>
          </g>
        ))}

        {showBollinger && bandPath && <path d={bandPath} className="fill-brand/10 stroke-none" />}
        {showBollinger && (
          <>
            <path d={linePath(bands.upper, x, y)} fill="none" className="stroke-brand/60" strokeWidth={1.5} />
            <path d={linePath(bands.lower, x, y)} fill="none" className="stroke-brand/60" strokeWidth={1.5} />
          </>
        )}

        {candles.map((c, i) => {
          const up = c.close >= c.open;
          const cx = x(i);
          const bodyTop = y(Math.max(c.open, c.close));
          const bodyBottom = y(Math.min(c.open, c.close));
          return (
            <g key={c.time} className={up ? 'fill-up stroke-up' : 'fill-down stroke-down'}>
              <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} strokeWidth={1.5} />
              <rect x={cx - bodyWidth / 2} y={bodyTop} width={bodyWidth} height={Math.max(1, bodyBottom - bodyTop)} />
              <rect
                x={cx - bodyWidth / 2}
                y={vy(c.volume)}
                width={bodyWidth}
                height={VOLUME_TOP + VOLUME_HEIGHT - vy(c.volume)}
                className={up ? 'fill-up/40' : 'fill-down/40'}
              />
            </g>
          );
        })}

        {showEma && <path d={linePath(ema, x, y)} fill="none" className="stroke-gold" strokeWidth={2} />}

        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={0} y2={HEIGHT} className="stroke-muted" strokeWidth={1} strokeDasharray="3 4" />
        )}

        <rect
          x={0}
          y={0}
          width={WIDTH}
          height={HEIGHT}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
        {showEma && (
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-gold" /> EMA 20
          </span>
        )}
        {showBollinger && (
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-brand/60" /> Bollinger 20, 2
          </span>
        )}
        <span>Volume {formatCompact(shown.volume)} at candle {shownIndex + 1} of {count}</span>
      </div>
    </div>
  );
}

function Readout({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  const color = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-fg';
  return (
    <div>
      <span className="text-muted">{label} </span>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

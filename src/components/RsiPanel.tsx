import { calculateRSI } from '@/lib/market-data';

const WIDTH = 1000;
const HEIGHT = 120;

interface RsiPanelProps {
  closes: number[];
}

export default function RsiPanel({ closes }: RsiPanelProps) {
  const rsi = calculateRSI(closes, 14);
  const step = WIDTH / Math.max(1, rsi.length - 1);
  const y = (v: number) => HEIGHT - (v / 100) * HEIGHT;

  let path = '';
  rsi.forEach((v, i) => {
    if (Number.isNaN(v)) return;
    path += `${path ? 'L' : 'M'}${(i * step).toFixed(2)},${y(v).toFixed(2)} `;
  });

  const last = rsi[rsi.length - 1];
  const lastText = Number.isNaN(last) ? '-' : last.toFixed(1);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-muted">RSI (14)</span>
        <span className="font-semibold tabular-nums text-gold">{lastText}</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full" role="img" aria-label="Relative strength index">
        <rect x={0} y={0} width={WIDTH} height={y(70)} className="fill-down/5" />
        <rect x={0} y={y(30)} width={WIDTH} height={HEIGHT - y(30)} className="fill-up/5" />
        {[30, 70].map((level) => (
          <line
            key={level}
            x1={0}
            x2={WIDTH}
            y1={y(level)}
            y2={y(level)}
            className="stroke-border"
            strokeWidth={1}
            strokeDasharray="6 6"
          />
        ))}
        <path d={path} fill="none" className="stroke-gold" strokeWidth={2} />
      </svg>
    </div>
  );
}

import { useMemo, useState } from 'react';
import CandleChart from '@/components/CandleChart';
import OrderPanel from '@/components/OrderPanel';
import PriceChange from '@/components/PriceChange';
import RsiPanel from '@/components/RsiPanel';
import {
  buildCandles,
  formatPrice,
  INSTRUMENTS_BY_SYMBOL,
  TIMEFRAMES,
  type Candle,
  type Instrument,
  type Timeframe,
} from '@/lib/market-data';

interface ChartsTabProps {
  instruments: Instrument[];
}

const DEFAULT_SYMBOL = 'EUR/USD';

export default function ChartsTab({ instruments }: ChartsTabProps) {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [timeframe, setTimeframe] = useState<Timeframe>('1H');
  const [showEma, setShowEma] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showRsi, setShowRsi] = useState(true);

  const live = instruments.find((i) => i.symbol === symbol) ?? instruments[0];

  const baseCandles = useMemo(
    () => buildCandles(INSTRUMENTS_BY_SYMBOL[symbol], timeframe),
    [symbol, timeframe]
  );

  const candles: Candle[] = useMemo(() => {
    if (!live || baseCandles.length === 0) return baseCandles;
    const last = baseCandles[baseCandles.length - 1];
    const patched = { ...last, close: live.price, high: Math.max(last.high, live.price), low: Math.min(last.low, live.price) };
    return [...baseCandles.slice(0, -1), patched];
  }, [baseCandles, live]);

  const closes = useMemo(() => candles.map((c) => c.close), [candles]);

  if (!live) return null;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <p className="text-xs font-semibold text-muted">Instrument</p>
            <div className="mt-1 flex items-center gap-3">
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                aria-label="Instrument"
                className="h-10 min-w-[220px] rounded-lg border border-border bg-card px-3 text-sm font-semibold text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              >
                {instruments.map((i) => (
                  <option key={i.symbol} value={i.symbol}>
                    {i.flag} {i.symbol} - {i.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">Last price</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-extrabold tabular-nums text-fg">{formatPrice(live.price, live.decimals)}</span>
              <PriceChange price={live.price} prevPrice={live.prevPrice} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TIMEFRAMES.map((tf) => {
            const active = tf.value === timeframe;
            return (
              <button
                key={tf.value}
                type="button"
                onClick={() => setTimeframe(tf.value)}
                aria-pressed={active}
                className={`h-8 min-w-[44px] rounded-md border px-3 text-xs font-semibold transition-all duration-200 ${
                  active ? 'border-brand bg-brand text-ink' : 'border-border bg-card text-muted hover:text-fg'
                }`}
              >
                {tf.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Toggle label="EMA 20" active={showEma} onToggle={() => setShowEma((v) => !v)} />
        <Toggle label="Bollinger Bands" active={showBollinger} onToggle={() => setShowBollinger((v) => !v)} />
        <Toggle label="RSI" active={showRsi} onToggle={() => setShowRsi((v) => !v)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <CandleChart
          candles={candles}
          decimals={live.decimals}
          showEma={showEma}
          showBollinger={showBollinger}
        />
      </div>

      {showRsi && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <RsiPanel closes={closes} />
        </div>
      )}
      </div>
      <aside className="h-fit xl:sticky xl:top-40">
        <OrderPanel key={symbol} instrument={live} />
      </aside>
      </div>
    </section>
  );
}

function Toggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`h-8 rounded-full border px-3.5 text-xs font-semibold transition-all duration-200 ${
        active ? 'border-gold/60 bg-gold/10 text-gold' : 'border-border bg-card text-muted hover:text-fg'
      }`}
    >
      {label}
    </button>
  );
}

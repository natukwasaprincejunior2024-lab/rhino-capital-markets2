import { useMemo, useState } from 'react';
import { formatCurrency, formatPrice, type Instrument } from '@/lib/market-data';
import { positionSize, profitLoss, riskReward, type TradeSide } from '@/lib/trade-math';

interface OrderPanelProps {
  instrument: Instrument;
}

function parseNumber(text: string): number | null {
  const n = Number(text);
  return text.trim() !== '' && Number.isFinite(n) && n > 0 ? n : null;
}

function offsetPrice(price: number, decimals: number, percent: number): string {
  return (price * (1 + percent / 100)).toFixed(decimals);
}

export default function OrderPanel({ instrument }: OrderPanelProps) {
  const { price, decimals } = instrument;
  const [side, setSide] = useState<TradeSide>('buy');
  const [units, setUnits] = useState('1000');
  const [stop, setStop] = useState(() => offsetPrice(price, decimals, side === 'buy' ? -0.5 : 0.5));
  const [target, setTarget] = useState(() => offsetPrice(price, decimals, side === 'buy' ? 1 : -1));
  const [balance, setBalance] = useState('10000');
  const [riskPct, setRiskPct] = useState('1');

  const entry = price;
  const stopValue = parseNumber(stop);
  const targetValue = parseNumber(target);
  const unitsValue = parseNumber(units);
  const balanceValue = parseNumber(balance);
  const riskValue = parseNumber(riskPct);

  const suggested = useMemo(() => {
    if (!balanceValue || !riskValue || !stopValue) return null;
    const size = positionSize(balanceValue, riskValue, entry, stopValue);
    return size > 0 ? size : null;
  }, [balanceValue, riskValue, stopValue, entry]);

  const ratio = stopValue && targetValue ? riskReward(entry, stopValue, targetValue) : null;
  const validStopSide = stopValue !== null && (side === 'buy' ? stopValue < entry : stopValue > entry);
  const validTargetSide = targetValue !== null && (side === 'buy' ? targetValue > entry : targetValue < entry);

  const pnlAtTarget = unitsValue && targetValue ? profitLoss(side, entry, targetValue, unitsValue) : null;
  const pnlAtStop = unitsValue && stopValue ? profitLoss(side, entry, stopValue, unitsValue) : null;
  const riskAmount = pnlAtStop === null ? null : Math.abs(pnlAtStop);

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-base font-bold text-fg">Place order</h2>
        <p className="mt-1 text-xs text-muted">Simulated order on {instrument.symbol}. Nothing is sent to a broker.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-bg p-1">
        {(['buy', 'sell'] as TradeSide[]).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={side === s}
            onClick={() => {
              setSide(s);
              setStop(offsetPrice(price, decimals, s === 'buy' ? -0.5 : 0.5));
              setTarget(offsetPrice(price, decimals, s === 'buy' ? 1 : -1));
            }}
            className={`rounded-md py-2 text-sm font-extrabold uppercase transition-all duration-200 ${
              side === s
                ? s === 'buy'
                  ? 'bg-up text-ink'
                  : 'bg-down text-white'
                : 'text-muted hover:text-fg'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted">Entry price</span>
        <span className="font-semibold tabular-nums text-fg">{formatPrice(entry, decimals)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Stop loss" value={stop} onChange={setStop} invalid={stopValue !== null && !validStopSide} />
        <NumberField label="Take profit" value={target} onChange={setTarget} invalid={targetValue !== null && !validTargetSide} />
      </div>
      {(!validStopSide || !validTargetSide) && (
        <p className="text-xs text-down">
          For a {side}, the stop loss must be {side === 'buy' ? 'below' : 'above'} the entry and the take profit {side === 'buy' ? 'above' : 'below'}.
        </p>
      )}

      <NumberField label="Units" value={units} onChange={setUnits} />

      <div className="rounded-lg border border-border bg-bg p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Risk calculator</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <NumberField label="Account balance" value={balance} onChange={setBalance} />
          <NumberField label="Risk per trade %" value={riskPct} onChange={setRiskPct} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Suggested size: <span className="font-semibold tabular-nums text-fg">{suggested ? suggested.toFixed(2) : '-'}</span> units
          </p>
          <button
            type="button"
            disabled={!suggested}
            onClick={() => suggested && setUnits(suggested.toFixed(2))}
            className="h-8 rounded-md border border-brand/60 px-3 text-xs font-semibold text-brand transition-all duration-200 hover:bg-brand/10 disabled:opacity-40"
          >
            Use size
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Profit at take profit" value={pnlAtTarget === null ? '-' : formatCurrency(pnlAtTarget, 'USD')} tone="up" />
        <Stat label="Loss at stop loss" value={riskAmount === null ? '-' : formatCurrency(-riskAmount, 'USD')} tone="down" />
        <Stat label="Reward to risk" value={ratio === null ? '-' : `1 : ${ratio.toFixed(2)}`} />
        <Stat label="Risk amount" value={riskAmount === null ? '-' : formatCurrency(riskAmount, 'USD')} />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  invalid = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        className={`h-10 w-full rounded-lg border bg-bg px-3 text-sm tabular-nums text-fg focus:outline-none focus:ring-2 focus:ring-brand/30 ${
          invalid ? 'border-down' : 'border-border focus:border-brand'
        }`}
      />
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  const color = tone === 'up' ? 'text-up' : tone === 'down' ? 'text-down' : 'text-fg';
  return (
    <div className="rounded-lg border border-border bg-bg p-3">
      <p className="text-[11px] font-semibold text-muted">{label}</p>
      <p className={`mt-1 text-sm font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

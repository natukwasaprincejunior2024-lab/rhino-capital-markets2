import { useMemo, useState } from 'react';
import { formatCurrency, formatPrice, type Instrument } from '@/lib/market-data';

interface CurrencyConverterProps {
  instruments: Instrument[];
}

type Direction = 'usd-to-local' | 'local-to-usd';

export default function CurrencyConverter({ instruments }: CurrencyConverterProps) {
  const pairs = useMemo(() => instruments.filter((i) => i.symbol.startsWith('USD/')), [instruments]);
  const [symbol, setSymbol] = useState(pairs[0]?.symbol ?? '');
  const [direction, setDirection] = useState<Direction>('usd-to-local');
  const [amountText, setAmountText] = useState('100');

  const pair = pairs.find((p) => p.symbol === symbol) ?? pairs[0];
  const amount = Number(amountText);
  const validAmount = amountText.trim() !== '' && Number.isFinite(amount) && amount >= 0;

  if (!pair) {
    return <p className="text-sm text-muted">No currency pairs are available right now.</p>;
  }

  const converted = validAmount
    ? direction === 'usd-to-local'
      ? amount * pair.price
      : amount / pair.price
    : null;

  const fromCode = direction === 'usd-to-local' ? 'USD' : pair.currencyCode;
  const toCode = direction === 'usd-to-local' ? pair.currencyCode : 'USD';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-bg p-1">
        {(['usd-to-local', 'local-to-usd'] as Direction[]).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={direction === d}
            onClick={() => setDirection(d)}
            className={`rounded-md py-2 text-xs font-semibold transition-all duration-200 ${
              direction === d ? 'bg-brand text-ink shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            {d === 'usd-to-local' ? 'USD to local' : 'Local to USD'}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">Currency</span>
        <select
          value={pair.symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          {pairs.map((p) => (
            <option key={p.symbol} value={p.symbol}>
              {p.flag} {p.currencyCode} ({p.symbol})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-muted">Amount in {fromCode}</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm tabular-nums text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </label>

      <div className="rounded-lg border border-border bg-bg p-4">
        <p className="text-xs font-semibold text-muted">Converted to {toCode}</p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-gold">
          {converted === null ? '-' : formatCurrency(converted, toCode)}
        </p>
        <p className="mt-2 text-xs tabular-nums text-muted">
          1 USD = {formatPrice(pair.price, pair.decimals)} {pair.currencyCode}
        </p>
      </div>
    </div>
  );
}

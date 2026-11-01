import { useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import TransactionReceipt from '@/components/TransactionReceipt';
import type { RateMap } from '@/components/RatesEditor';
import type { BureauProfile, NewTransaction, TransactionRow } from '@/lib/bureau-api';
import { calculateTransaction, formatCurrency, formatPrice, type Instrument, type TransactionType } from '@/lib/market-data';

interface TransactionCalculatorProps {
  instruments: Instrument[];
  rates: RateMap;
  profile: BureauProfile;
  onRecord: (input: NewTransaction) => Promise<TransactionRow>;
}

const DIRECTIONS: { value: TransactionType; label: string; hint: string }[] = [
  { value: 'buy', label: 'Customer buys USD', hint: 'Uses the selling rate' },
  { value: 'sell', label: 'Customer sells USD', hint: 'Uses the buying rate' },
];

export default function TransactionCalculator({ instruments, rates, profile, onRecord }: TransactionCalculatorProps) {
  const [symbol, setSymbol] = useState(instruments[0]?.symbol ?? '');
  const [type, setType] = useState<TransactionType>('buy');
  const [amountText, setAmountText] = useState('');
  const [customer, setCustomer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{ transaction: TransactionRow; instrument: Instrument } | null>(null);

  const instrument = instruments.find((i) => i.symbol === symbol);
  const amount = Number(amountText);
  const validAmount = amount > 0;

  const preview = useMemo(() => {
    if (!instrument || !rates[instrument.symbol] || !validAmount) return null;
    const quoted: Instrument = {
      ...instrument,
      buying: rates[instrument.symbol].buying,
      selling: rates[instrument.symbol].selling,
    };
    const result = calculateTransaction(amount, quoted, type);
    return { ...result, total: Math.round(result.total * 100) / 100 };
  }, [instrument, rates, amount, validAmount, type]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!instrument || !preview) {
      setError('Enter an amount greater than zero.');
      return;
    }
    setSubmitting(true);
    try {
      const transaction = await onRecord({
        symbol: instrument.symbol,
        type,
        amount: Math.round(amount * 100) / 100,
        rate: preview.rate,
        total: preview.total,
        customer: customer.trim(),
      });
      setReceipt({ transaction, instrument });
      setAmountText('');
      setCustomer('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-extrabold text-fg">Transaction calculator</h2>
      <p className="mb-5 text-xs text-muted">Quote an exchange and record it in the bureau history.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Currency</span>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            {instruments.map((i) => (
              <option key={i.symbol} value={i.symbol}>
                {i.flag} {i.symbol} - {i.name}
              </option>
            ))}
          </select>
        </label>

        <div role="radiogroup" aria-label="Direction" className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-bg p-1">
          {DIRECTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              role="radio"
              aria-checked={type === d.value}
              onClick={() => setType(d.value)}
              className={`rounded-md px-2 py-2 text-xs font-semibold transition-all duration-200 ${
                type === d.value ? 'bg-brand text-ink shadow-sm' : 'text-muted hover:text-fg'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Amount (USD)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0.00"
            className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm tabular-nums text-fg placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        <div className="rounded-lg border border-border bg-bg p-4">
          {preview && instrument ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Rate</dt>
                <dd className="font-semibold tabular-nums text-fg">{formatPrice(preview.rate, instrument.decimals)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Total</dt>
                <dd className="text-lg font-extrabold tabular-nums text-gold">
                  {formatCurrency(preview.total, instrument.currencyCode)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Bureau margin</dt>
                <dd className="font-semibold tabular-nums text-up">
                  {formatCurrency(preview.profit, instrument.currencyCode)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-center text-xs text-muted">Enter an amount to see the quote.</p>
          )}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Customer name (optional)</span>
          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!preview || submitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-extrabold text-ink transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? 'Recording' : 'Record transaction'}
        </button>
      </form>

      {receipt && (
        <TransactionReceipt
          transaction={receipt.transaction}
          instrument={receipt.instrument}
          profile={profile}
          onClose={() => setReceipt(null)}
        />
      )}
    </section>
  );
}

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { formatPrice, type Instrument } from '@/lib/market-data';
import type { AlertDirection, NewPriceAlert } from '@/lib/alerts-api';

interface AlertFormModalProps {
  instruments: Instrument[];
  onSave: (input: NewPriceAlert) => Promise<void>;
  onClose: () => void;
}

export default function AlertFormModal({ instruments, onSave, onClose }: AlertFormModalProps) {
  const [symbol, setSymbol] = useState(instruments[0]?.symbol ?? '');
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [target, setTarget] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instrument = instruments.find((i) => i.symbol === symbol);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const targetValue = Number(target);
    if (!instrument) {
      setError('Choose an instrument.');
      return;
    }
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      setError('Enter a target price greater than zero.');
      return;
    }
    const validSide = direction === 'above' ? targetValue > instrument.price : targetValue < instrument.price;
    if (!validSide) {
      setError(
        `For an alert ${direction === 'above' ? 'above' : 'below'}, the target must be ${
          direction === 'above' ? 'higher' : 'lower'
        } than the current price.`
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ symbol: instrument.symbol, direction, target: targetValue });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the alert.');
      setSaving(false);
    }
  };

  return (
    <Modal title="New price alert" onClose={onClose} widthClass="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Instrument</span>
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

        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-bg p-1">
          {(['above', 'below'] as AlertDirection[]).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={direction === d}
              onClick={() => setDirection(d)}
              className={`rounded-md py-2 text-xs font-semibold capitalize transition-all duration-200 ${
                direction === d ? 'bg-brand text-ink' : 'text-muted hover:text-fg'
              }`}
            >
              Price {d}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Target price</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm tabular-nums text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        {instrument && (
          <p className="text-xs text-muted">
            Current price {formatPrice(instrument.price, instrument.decimals)}
          </p>
        )}

        {error && <p className="text-sm text-down">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-fg transition-colors duration-200 hover:border-brand"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-extrabold text-ink transition-all duration-200 hover:brightness-110 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Create alert
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { formatPrice, type Instrument } from '@/lib/market-data';
import type { NewPosition } from '@/lib/portfolio-api';
import type { TradeSide } from '@/lib/trade-math';

interface PositionFormModalProps {
  instruments: Instrument[];
  onSave: (input: NewPosition) => Promise<void>;
  onClose: () => void;
}

export default function PositionFormModal({ instruments, onSave, onClose }: PositionFormModalProps) {
  const [symbol, setSymbol] = useState(instruments[0]?.symbol ?? '');
  const [side, setSide] = useState<TradeSide>('buy');
  const [units, setUnits] = useState('1000');
  const [entry, setEntry] = useState(() => (instruments[0] ? instruments[0].price.toFixed(instruments[0].decimals) : ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instrument = instruments.find((i) => i.symbol === symbol);

  const handleSymbolChange = (next: string) => {
    setSymbol(next);
    const match = instruments.find((i) => i.symbol === next);
    if (match) setEntry(match.price.toFixed(match.decimals));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const unitsValue = Number(units);
    const entryValue = Number(entry);
    if (!instrument) {
      setError('Choose an instrument.');
      return;
    }
    if (!Number.isFinite(unitsValue) || unitsValue <= 0) {
      setError('Units must be greater than zero.');
      return;
    }
    if (!Number.isFinite(entryValue) || entryValue <= 0) {
      setError('Entry price must be greater than zero.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ symbol: instrument.symbol, side, units: unitsValue, entryPrice: entryValue });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the position.');
      setSaving(false);
    }
  };

  return (
    <Modal title="Add position" onClose={onClose} widthClass="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Instrument</span>
          <select
            value={symbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
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
          {(['buy', 'sell'] as TradeSide[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={side === s}
              onClick={() => setSide(s)}
              className={`rounded-md py-2 text-xs font-extrabold uppercase transition-all duration-200 ${
                side === s ? (s === 'buy' ? 'bg-up text-ink' : 'bg-down text-white') : 'text-muted hover:text-fg'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Units</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm tabular-nums text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted">Entry price</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm tabular-nums text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </label>
        </div>

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
            Save position
          </button>
        </div>
      </form>
    </Modal>
  );
}

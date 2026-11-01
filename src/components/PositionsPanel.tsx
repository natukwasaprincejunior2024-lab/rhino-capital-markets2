import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import PositionFormModal from '@/components/PositionFormModal';
import { formatCurrency, formatPrice, INSTRUMENTS_BY_SYMBOL, type Instrument } from '@/lib/market-data';
import type { NewPosition, Position } from '@/lib/portfolio-api';
import { profitLoss } from '@/lib/trade-math';

interface PositionsPanelProps {
  instruments: Instrument[];
  positions: Position[];
  loading: boolean;
  error: string | null;
  onAdd: (input: NewPosition) => Promise<void>;
  onClose: (id: string) => Promise<void>;
}

export default function PositionsPanel({ instruments, positions, loading, error, onAdd, onClose }: PositionsPanelProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const livePrice = (symbol: string): number | undefined =>
    instruments.find((i) => i.symbol === symbol)?.price;

  const handleClose = async (id: string) => {
    setClosingId(id);
    setActionError(null);
    try {
      await onClose(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not close the position.');
    } finally {
      setClosingId(null);
    }
  };

  const totalPnl = positions.reduce((sum, p) => {
    const price = livePrice(p.symbol);
    return price === undefined ? sum : sum + profitLoss(p.side, p.entryPrice, price, p.units);
  }, 0);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-fg">Open positions</h2>
          <p className="mt-1 text-xs text-muted">
            Unrealised profit or loss: <span className={`font-semibold tabular-nums ${totalPnl >= 0 ? 'text-up' : 'text-down'}`}>{formatCurrency(totalPnl, 'USD')}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          disabled={instruments.length === 0}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3.5 text-xs font-extrabold text-ink transition-all duration-200 hover:brightness-110 disabled:opacity-40"
        >
          <Plus size={14} /> Add position
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}
      {actionError && <p className="mt-4 text-sm text-down">{actionError}</p>}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 size={20} className="animate-spin text-brand" />
        </div>
      ) : positions.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
          You have no open positions. Add one to track its profit or loss against live prices.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {positions.map((p) => {
            const price = livePrice(p.symbol);
            const decimals = INSTRUMENTS_BY_SYMBOL[p.symbol]?.decimals ?? 4;
            const pnl = price === undefined ? null : profitLoss(p.side, p.entryPrice, price, p.units);
            return (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-fg">
                    {p.symbol}
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${p.side === 'buy' ? 'bg-up/15 text-up' : 'bg-down/15 text-down'}`}>
                      {p.side}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-muted">
                    {p.units} units at {formatPrice(p.entryPrice, decimals)}
                    {price !== undefined && <> / now {formatPrice(price, decimals)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-sm font-bold tabular-nums ${pnl === null ? 'text-muted' : pnl >= 0 ? 'text-up' : 'text-down'}`}>
                    {pnl === null ? '-' : formatCurrency(pnl, 'USD')}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleClose(p.id)}
                    disabled={closingId === p.id}
                    aria-label={`Close ${p.symbol} position`}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors duration-200 hover:bg-down/15 hover:text-down disabled:opacity-40"
                  >
                    {closingId === p.id ? <Loader2 size={14} className="animate-spin" /> : <X size={16} />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {formOpen && (
        <PositionFormModal instruments={instruments} onSave={onAdd} onClose={() => setFormOpen(false)} />
      )}
    </section>
  );
}

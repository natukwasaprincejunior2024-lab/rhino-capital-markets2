import { useState } from 'react';
import { BellRing, Loader2, Plus, X } from 'lucide-react';
import AlertFormModal from '@/components/AlertFormModal';
import BillingModal from '@/components/BillingModal';
import { useAuth } from '@/lib/auth-context';
import { alertLimit } from '@/lib/billing-api';
import { formatPrice, type Instrument } from '@/lib/market-data';
import type { NewPriceAlert, PriceAlert } from '@/lib/alerts-api';

interface AlertsPanelProps {
  instruments: Instrument[];
  alerts: PriceAlert[];
  loading: boolean;
  error: string | null;
  onAdd: (input: NewPriceAlert) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

export default function AlertsPanel({ instruments, alerts, loading, error, onAdd, onRemove }: AlertsPanelProps) {
  const { billing } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const limit = billing ? alertLimit(billing) : 0;
  const activeCount = alerts.filter((a) => !a.triggeredAt).length;
  const atLimit = limit !== null && activeCount >= limit;

  const decimalsFor = (symbol: string): number => instruments.find((i) => i.symbol === symbol)?.decimals ?? 4;

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    setActionError(null);
    try {
      await onRemove(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete the alert.');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-fg">Price alerts</h2>
          <p className="mt-1 text-xs text-muted">Alerts appear in your notifications when a price reaches the target.</p>
          {limit !== null && (
            <p className="mt-2 text-xs font-semibold tabular-nums text-muted">
              {activeCount} of {limit} active alerts used
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => (atLimit ? setShowUpgrade(true) : setFormOpen(true))}
          disabled={instruments.length === 0}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-brand/60 bg-brand/10 px-3.5 text-xs font-semibold text-brand transition-all duration-200 hover:bg-brand/20 disabled:opacity-40"
        >
          <Plus size={14} /> New alert
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">{error}</p>}
      {actionError && <p className="mt-4 text-sm text-down">{actionError}</p>}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 size={20} className="animate-spin text-brand" />
        </div>
      ) : alerts.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
          No price alerts yet. Create one to be notified when a market moves to your price.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {alerts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <BellRing size={16} className={a.triggeredAt ? 'text-muted' : 'text-gold'} />
                <div className="min-w-0">
                  <p className="font-semibold text-fg">
                    {a.symbol} {a.direction} {formatPrice(a.target, decimalsFor(a.symbol))}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{a.triggeredAt ? 'Triggered' : 'Waiting for price'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleRemove(a.id)}
                disabled={removingId === a.id}
                aria-label={`Delete alert for ${a.symbol}`}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors duration-200 hover:bg-down/15 hover:text-down disabled:opacity-40"
              >
                {removingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <X size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {formOpen && <AlertFormModal instruments={instruments} onSave={onAdd} onClose={() => setFormOpen(false)} />}
      {showUpgrade && <BillingModal reason="alerts" onClose={() => setShowUpgrade(false)} />}
    </section>
  );
}

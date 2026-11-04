import { useState } from 'react';
import { AlertTriangle, ArrowLeft, CreditCard, Loader2, Monitor, Printer, Bell, Smartphone, Sparkles } from 'lucide-react';
import Modal from '@/components/Modal';
import MomoPaymentForm, { type MomoOrder } from '@/components/MomoPaymentForm';
import { startCheckout, type ProductKey } from '@/lib/billing-api';
import { DISPLAY_HOUR, DISPLAY_HOUR_OPTIONS, MOMO_PRICES_UGX, PRINT_PACKS } from '@/lib/billing-catalog';

export type BillingReason = 'print' | 'display' | 'alerts';

interface BillingModalProps {
  reason: BillingReason;
  onClose: () => void;
}

type PaymentMethod = 'card' | 'momo';

const REASON_COPY: Record<BillingReason, { title: string; body: string; icon: typeof Printer }> = {
  print: {
    title: 'Unlock more prints',
    body: 'Your free print is used. Buy print credits to print or export this report. Paid plans include unlimited prints.',
    icon: Printer,
  },
  display: {
    title: 'Display time is up',
    body: 'Your free 30 minutes for today have run out. Buy display time to keep the board on screen. Paid plans include unlimited display time.',
    icon: Monitor,
  },
  alerts: {
    title: 'Price alerts need a paid plan',
    body: 'Your plan has reached its alert limit or does not include price alerts. Upgrade to add more.',
    icon: Bell,
  },
};

const OPTION_CLASS =
  'flex flex-col items-start gap-1 rounded-xl border border-border bg-bg p-4 text-left transition-all duration-200 hover:border-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-50';

const METHOD_OPTIONS: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'momo', label: 'MTN MoMo', icon: Smartphone },
];

export default function BillingModal({ reason, onClose }: BillingModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [momoOrder, setMomoOrder] = useState<MomoOrder | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = REASON_COPY[reason];
  const Icon = copy.icon;

  const buy = async (product: ProductKey, quantity = 1) => {
    const key = `${product}-${quantity}`;
    setBusyKey(key);
    setError(null);
    try {
      await startCheckout(product, quantity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout. Please try again.');
      setBusyKey(null);
    }
  };

  const orderWithMomo = (product: ProductKey, quantity: number, label: string) => {
    setMomoOrder({
      product,
      quantity,
      amountUgx: MOMO_PRICES_UGX[product] * quantity,
      label,
    });
  };

  const isBusy = busyKey !== null;
  const showOptions = reason !== 'alerts' && !momoOrder;

  return (
    <Modal title={copy.title} onClose={onClose} widthClass="max-w-xl">
      <div className="space-y-5">
        {momoOrder ? (
          <>
            <button
              type="button"
              onClick={() => setMomoOrder(null)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors duration-200 hover:text-brand"
            >
              <ArrowLeft size={16} /> Back to options
            </button>
            <MomoPaymentForm order={momoOrder} onDone={onClose} />
          </>
        ) : (
          <>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                <Icon size={20} />
              </div>
              <p className="text-sm leading-relaxed text-muted">{copy.body}</p>
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-lg border border-down/40 bg-down/10 p-3 text-sm text-down">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            {showOptions && (
              <>
                <div role="group" aria-label="Payment method" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1">
                  {METHOD_OPTIONS.map(({ id, label, icon: MethodIcon }) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={method === id}
                      onClick={() => setMethod(id)}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                        method === id ? 'bg-brand text-ink' : 'text-muted hover:text-fg'
                      }`}
                    >
                      <MethodIcon size={16} /> {label}
                    </button>
                  ))}
                </div>

                {reason === 'print' && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {PRINT_PACKS.map((pack) => (
                      <button
                        key={pack.product}
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          method === 'card'
                            ? void buy(pack.product)
                            : orderWithMomo(pack.product, 1, `${pack.prints} ${pack.prints === 1 ? 'print' : 'prints'}`)
                        }
                        className={OPTION_CLASS}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          {pack.prints} {pack.prints === 1 ? 'print' : 'prints'}
                        </span>
                        <span className="text-xl font-extrabold text-fg">{pack.price}</span>
                        <span className="text-xs text-muted">About {pack.ugx}</span>
                        {pack.saving && <span className="text-xs font-bold text-up">{pack.saving}</span>}
                        {busyKey === `${pack.product}-1` && <Loader2 size={14} className="mt-1 animate-spin text-brand" />}
                      </button>
                    ))}
                  </div>
                )}

                {reason === 'display' && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {DISPLAY_HOUR_OPTIONS.map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          method === 'card'
                            ? void buy('display_hour', hours)
                            : orderWithMomo('display_hour', hours, `${hours} ${hours === 1 ? 'hour' : 'hours'} of display time`)
                        }
                        className={OPTION_CLASS}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                          {hours} {hours === 1 ? 'hour' : 'hours'}
                        </span>
                        <span className="text-xl font-extrabold text-fg">
                          {method === 'card' ? `$${(hours * 0.1).toFixed(2)}` : `UGX ${(MOMO_PRICES_UGX.display_hour * hours).toLocaleString('en-US')}`}
                        </span>
                        <span className="text-xs text-muted">
                          About UGX {(hours * MOMO_PRICES_UGX.display_hour).toLocaleString('en-US')}
                        </span>
                        {busyKey === `display_hour-${hours}` && <Loader2 size={14} className="mt-1 animate-spin text-brand" />}
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted">
                  Display time is {DISPLAY_HOUR.price} an hour ({DISPLAY_HOUR.ugx}).{' '}
                  {method === 'card' ? 'Payments are processed securely by Stripe.' : 'MoMo payments are confirmed by our team after you submit the transaction ID.'}
                </p>
              </>
            )}

            <a
              href="/pricing"
              className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition-colors duration-200 hover:bg-gold/20"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={16} /> See subscription plans
              </span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </>
        )}
      </div>
    </Modal>
  );
}

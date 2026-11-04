import { useState, type FormEvent } from 'react';
import { AlertTriangle, Check, Copy, Loader2, Smartphone } from 'lucide-react';
import { MOMO_MERCHANT } from '@/lib/billing-catalog';
import type { ProductKey } from '@/lib/billing-api';
import { isValidTransactionId, submitMomoPayment } from '@/lib/momo-api';

export interface MomoOrder {
  product: ProductKey;
  quantity: number;
  amountUgx: number;
  label: string;
}

interface MomoPaymentFormProps {
  order: MomoOrder;
  onDone: () => void;
}

export default function MomoPaymentForm({ order, onDone }: MomoPaymentFormProps) {
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidTransactionId(transactionId)) {
      setError('Enter the transaction ID from your MoMo confirmation message (letters and numbers only).');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitMomoPayment({
        product: order.product,
        quantity: order.quantity,
        amountUgx: order.amountUgx,
        transactionId,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-up/15 text-up">
          <Check size={24} />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-extrabold">Payment received for review</p>
          <p className="text-sm leading-relaxed text-muted">
            We check every MoMo payment before activating it. Your {order.label.toLowerCase()} will appear on your account once it is confirmed.
          </p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-lg bg-brand py-2.5 text-sm font-extrabold text-ink transition-all duration-200 hover:brightness-110"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-bg p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{order.label}</p>
          <p className="text-2xl font-extrabold tabular-nums text-fg">UGX {order.amountUgx.toLocaleString('en-US')}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
          <Smartphone size={20} />
        </div>
      </div>

      <ol className="space-y-2 text-sm leading-relaxed text-muted">
        <li>1. In the MTN MoMo app, pay merchant code <span className="font-bold text-fg">{MOMO_MERCHANT.merchantCode}</span> the amount above.</li>
        <li>2. Or send the money to <span className="font-bold text-fg">{MOMO_MERCHANT.number}</span> ({MOMO_MERCHANT.name}).</li>
        <li>3. Copy the transaction ID from the MoMo confirmation and enter it below.</li>
      </ol>

      <div className="grid gap-2 sm:grid-cols-2">
        <CopyField label="Merchant code" value={MOMO_MERCHANT.merchantCode} />
        <CopyField label="MoMo number" value={MOMO_MERCHANT.number} />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">MoMo transaction ID</span>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            disabled={submitting}
            autoComplete="off"
            placeholder="e.g. 1234567890"
            className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg outline-none transition-colors duration-200 placeholder:text-muted focus:border-brand"
          />
        </label>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-down/40 bg-down/10 p-3 text-sm text-down">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-extrabold text-ink transition-all duration-200 hover:brightness-110 disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Submit payment
        </button>
      </form>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 text-left transition-colors duration-200 hover:border-brand"
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
        <span className="block truncate text-sm font-bold tabular-nums text-fg">{value}</span>
      </span>
      {copied ? <Check size={16} className="shrink-0 text-up" /> : <Copy size={16} className="shrink-0 text-muted" />}
    </button>
  );
}

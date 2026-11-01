import { Printer } from 'lucide-react';
import Modal from '@/components/Modal';
import type { TransactionRow, BureauProfile } from '@/lib/bureau-api';
import { bureauContactLine, bureauDisplayName, BUREAU_TIME_ZONE } from '@/lib/bureau-info';
import { formatCurrency, formatPrice, type Instrument } from '@/lib/market-data';

interface TransactionReceiptProps {
  transaction: TransactionRow;
  instrument: Instrument;
  profile: BureauProfile;
  onClose: () => void;
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right tabular-nums ${strong ? 'text-base font-extrabold text-fg' : 'font-semibold text-fg'}`}>
        {value}
      </dd>
    </div>
  );
}

export default function TransactionReceipt({ transaction, instrument, profile, onClose }: TransactionReceiptProps) {
  const bureauName = bureauDisplayName(profile);
  const contactLine = bureauContactLine(profile);
  const isBuy = transaction.type === 'buy';
  const issuedAt = new Date(transaction.createdAt).toLocaleString('en-GB', {
    timeZone: BUREAU_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Modal title="Transaction receipt" onClose={onClose} widthClass="max-w-md">
      <div className="no-print mb-4 flex">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-xs font-extrabold text-ink transition-all duration-200 hover:brightness-110"
        >
          <Printer size={14} /> Print receipt
        </button>
      </div>

      <article className="print-area rounded-xl border border-border bg-bg p-6">
        <header className="border-b border-dashed border-border pb-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{bureauName}</p>
          <h3 className="mt-1 text-lg font-extrabold text-fg">Exchange receipt</h3>
          {contactLine && <p className="mt-1 text-xs text-muted">{contactLine}</p>}
          <p className="mt-1 text-xs tabular-nums text-muted">{issuedAt} EAT</p>
        </header>

        <dl className="divide-y divide-border/60 py-3 text-sm">
          <Line label="Receipt no." value={transaction.id.slice(0, 8).toUpperCase()} />
          <Line label="Customer" value={transaction.customer || 'Walk-in customer'} />
          <Line label="Transaction" value={isBuy ? 'Customer bought USD' : 'Customer sold USD'} />
          <Line label="Currency pair" value={instrument.symbol} />
          <Line label="Amount (USD)" value={formatCurrency(transaction.amount, 'USD')} />
          <Line label="Rate" value={formatPrice(transaction.rate, instrument.decimals)} />
        </dl>

        <div className="mt-2 rounded-lg border border-border bg-card px-4 py-3">
          <Line
            label={isBuy ? 'Amount paid' : 'Amount received'}
            value={formatCurrency(transaction.total, instrument.currencyCode)}
            strong
          />
        </div>

        <footer className="mt-6 border-t border-dashed border-border pt-4 text-center text-xs text-muted">
          Thank you for banking with {bureauName}.
        </footer>
      </article>
    </Modal>
  );
}

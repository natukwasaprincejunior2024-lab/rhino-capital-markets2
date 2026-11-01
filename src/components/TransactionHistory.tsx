import { INSTRUMENTS_BY_SYMBOL, formatCurrency, formatPrice } from '@/lib/market-data';
import type { TransactionRow } from '@/lib/bureau-api';

interface TransactionHistoryProps {
  transactions: TransactionRow[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-extrabold text-fg">Transaction history</h2>
        <p className="text-xs text-muted">Most recent exchanges recorded by the bureau.</p>
      </div>

      {transactions.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted">No transactions recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 text-left font-semibold">Date</th>
                <th className="px-3 py-3 text-left font-semibold">Pair</th>
                <th className="px-3 py-3 text-left font-semibold">Direction</th>
                <th className="px-3 py-3 text-right font-semibold">Amount (USD)</th>
                <th className="px-3 py-3 text-right font-semibold">Rate</th>
                <th className="px-3 py-3 text-right font-semibold">Total</th>
                <th className="px-5 py-3 text-left font-semibold">Customer</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const instrument = INSTRUMENTS_BY_SYMBOL[t.symbol];
                const decimals = instrument?.decimals ?? 2;
                const currency = instrument?.currencyCode ?? 'USD';
                return (
                  <tr key={t.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3 tabular-nums text-muted">
                      {new Date(t.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-3 py-3 font-semibold text-fg">{t.symbol}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                          t.type === 'buy' ? 'bg-up/15 text-up' : 'bg-down/15 text-down'
                        }`}
                      >
                        {t.type === 'buy' ? 'Customer buys' : 'Customer sells'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-fg">{formatCurrency(t.amount, 'USD')}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted">{formatPrice(t.rate, decimals)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-fg">{formatCurrency(t.total, currency)}</td>
                    <td className="px-5 py-3 text-muted">{t.customer || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

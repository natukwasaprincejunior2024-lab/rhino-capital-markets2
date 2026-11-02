import { Check, Minus } from 'lucide-react';

type Cell = boolean | string;

interface ComparisonRow {
  label: string;
  values: [Cell, Cell, Cell, Cell, Cell];
}

const COLUMNS = ['Free', 'Daily', 'Weekly', 'Monthly', 'Yearly'] as const;

const ROWS: ComparisonRow[] = [
  { label: 'Currency pairs', values: ['3', '24', '24', '24', '24'] },
  { label: 'Price refresh', values: ['15 seconds', '2 seconds', '2 seconds', '2 seconds', '2 seconds'] },
  { label: 'Chart indicators', values: ['1H and 1D MA', 'All', 'All', 'All', 'All'] },
  { label: 'Maximum leverage', values: ['20x', '500x', '500x', '500x', '500x'] },
  { label: 'Order book', values: [false, true, true, true, true] },
  { label: 'Margin risk calendar and news', values: [false, true, true, true, true] },
  { label: 'Price alerts', values: ['None', '5', '20', 'Unlimited', 'Unlimited'] },
  { label: 'Daily rate prints', values: ['1 free, then pay', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
  { label: 'Display board', values: ['30 min a day', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'] },
  { label: 'M-Pesa payments', values: [false, false, true, true, true] },
  { label: 'WhatsApp sharing', values: [false, false, true, true, true] },
  { label: 'Audit trail', values: [false, false, true, true, true] },
  { label: 'Copy trading', values: [false, false, false, true, true] },
  { label: 'Webhooks', values: [false, false, false, true, true] },
  { label: 'Unlimited bureau', values: [false, false, false, true, true] },
  { label: 'BOU report', values: [false, false, false, true, true] },
  { label: 'Offline app', values: [false, false, false, true, true] },
  { label: 'API access', values: [false, false, false, false, true] },
  { label: 'Whale and correlation analysis', values: [false, false, false, false, true] },
  { label: 'White label', values: [false, false, false, false, true] },
  { label: 'One-on-one onboarding call', values: [false, false, false, false, true] },
];

function ValueCell({ value }: { value: Cell }) {
  if (value === true) {
    return <Check size={18} className="mx-auto text-up" aria-label="Included" />;
  }
  if (value === false) {
    return <Minus size={18} className="mx-auto text-muted/60" aria-label="Not included" />;
  }
  return <span className="text-sm font-medium text-fg">{value}</span>;
}

export default function PricingComparison() {
  return (
    <section aria-labelledby="compare-heading" className="space-y-6">
      <div className="text-center">
        <h2 id="compare-heading" className="text-2xl font-extrabold tracking-tight">Compare every plan</h2>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-5 py-4 text-sm font-semibold text-muted">Feature</th>
              {COLUMNS.map((name) => (
                <th key={name} scope="col" className="px-4 py-4 text-center text-sm font-extrabold text-fg">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, index) => (
              <tr
                key={row.label}
                className={`border-b border-border/60 transition-colors duration-200 last:border-b-0 hover:bg-bg/70 ${
                  index % 2 === 1 ? 'bg-bg/40' : ''
                }`}
              >
                <th scope="row" className="px-5 py-3.5 text-sm font-medium text-fg">{row.label}</th>
                {row.values.map((value, i) => (
                  <td key={COLUMNS[i]} className="px-4 py-3.5 text-center">
                    <ValueCell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

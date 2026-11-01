import { formatPercent, formatPrice, type DailyReport } from '@/lib/market-data';

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function reportToCsv(report: DailyReport): string {
  const header = ['Pair', 'Currency', 'Buying', 'Selling', 'Middle', 'Change %', 'High', 'Low'];
  const lines = report.rows.map((r) => [
    r.symbol,
    r.currencyCode,
    r.buying,
    r.selling,
    r.middle,
    r.changePct.toFixed(2),
    r.high,
    r.low,
  ]);
  return [header, ...lines].map((line) => line.map(csvCell).join(',')).join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function reportToShareText(report: DailyReport, bureauName: string): string {
  const lines = report.rows.map(
    (r) => `${r.flag} ${r.symbol}: Buy ${formatPrice(r.buying, 2)} | Sell ${formatPrice(r.selling, 2)} (${formatPercent(r.changePct)})`
  );
  return [`${bureauName} - Rates for ${report.date}`, '', ...lines].join('\n');
}

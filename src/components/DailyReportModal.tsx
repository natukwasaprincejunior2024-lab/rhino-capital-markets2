import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, Download, FileText, Image as ImageIcon, Printer, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import BillingModal from '@/components/BillingModal';
import Modal from '@/components/Modal';
import { consumePrintCredit } from '@/lib/billing-api';
import { bureauContactLine, bureauDisplayName, BUREAU_TIME_ZONE } from '@/lib/bureau-info';
import type { BureauProfile } from '@/lib/bureau-api';
import { formatPercent, formatPrice, type DailyReport } from '@/lib/market-data';
import { buildReportPdf } from '@/lib/report-pdf';
import { downloadBlob, downloadCsv, reportToCsv, reportToShareText } from '@/lib/report-export';

interface DailyReportModalProps {
  report: DailyReport;
  profile: BureauProfile;
  onClose: () => void;
}

type PaidAction = 'print' | 'pdf' | 'png';

const ACTION_CLASS =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-bg px-3.5 text-xs font-semibold text-fg transition-all duration-200 hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50';

export default function DailyReportModal({ report, profile, onClose }: DailyReportModalProps) {
  const bureauName = bureauDisplayName(profile);
  const contactLine = bureauContactLine(profile);
  const issuedAt = new Date().toLocaleString('en-GB', {
    timeZone: BUREAU_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const articleRef = useRef<HTMLElement>(null);
  const [busy, setBusy] = useState<PaidAction | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleCsv = useCallback(() => {
    downloadCsv(`Rhino_Daily_Rates_${report.date}.csv`, reportToCsv(report));
  }, [report]);

  const handleWhatsApp = useCallback(() => {
    const text = encodeURIComponent(reportToShareText(report, bureauName));
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }, [report, bureauName]);

  const exportPdf = useCallback(() => {
    buildReportPdf(report, { bureauName, contactLine, issuedAt }).save(`Rhino_Daily_Rates_${report.date}.pdf`);
  }, [report, bureauName, contactLine, issuedAt]);

  const exportPng = useCallback(async () => {
    const element = articleRef.current;
    if (!element) throw new Error('The report is not ready yet. Please try again.');
    const background = window.getComputedStyle(element).backgroundColor;
    const canvas = await html2canvas(element, { backgroundColor: background, scale: 2 });
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Could not create the image. Please try again.');
    downloadBlob(`Rhino_Daily_Rates_${report.date}.png`, blob);
  }, [report.date]);

  const runPaidAction = useCallback(
    async (action: PaidAction) => {
      setBusy(action);
      setExportError(null);
      try {
        const allowed = await consumePrintCredit();
        if (!allowed) {
          setShowPaywall(true);
          return;
        }
        if (action === 'print') window.print();
        if (action === 'pdf') exportPdf();
        if (action === 'png') await exportPng();
      } catch (err) {
        setExportError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      } finally {
        setBusy(null);
      }
    },
    [exportPdf, exportPng],
  );

  return (
    <>
      <Modal title="Daily rate report" onClose={onClose} widthClass="max-w-4xl">
        <div className="no-print mb-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy !== null} onClick={() => void runPaidAction('print')} className={ACTION_CLASS}>
              <Printer size={14} /> Print
            </button>
            <button type="button" disabled={busy !== null} onClick={() => void runPaidAction('pdf')} className={ACTION_CLASS}>
              <FileText size={14} /> Download PDF
            </button>
            <button type="button" disabled={busy !== null} onClick={() => void runPaidAction('png')} className={ACTION_CLASS}>
              <ImageIcon size={14} /> Download PNG
            </button>
            <button type="button" onClick={handleCsv} className={ACTION_CLASS}>
              <Download size={14} /> Download CSV
            </button>
            <button type="button" onClick={handleWhatsApp} className={ACTION_CLASS}>
              <Share2 size={14} /> Share on WhatsApp
            </button>
          </div>
          {exportError && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-down/40 bg-down/10 p-3 text-sm text-down">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {exportError}
            </p>
          )}
        </div>

        <article ref={articleRef} className="print-area rounded-xl border border-border bg-bg p-6 sm:p-8">
          <header className="flex flex-col gap-4 border-b-2 border-brand pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">{bureauName}</p>
              <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-fg">Daily Foreign Exchange Rates</h3>
              {contactLine && <p className="mt-1 text-xs text-muted">{contactLine}</p>}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted">
              <dt className="font-semibold">Date</dt>
              <dd className="tabular-nums text-fg">{report.date}</dd>
              <dt className="font-semibold">Issued</dt>
              <dd className="tabular-nums text-fg">{issuedAt} EAT</dd>
            </dl>
          </header>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="py-3 pr-3">Currency</th>
                  <th className="py-3 pr-3 text-right">Buying</th>
                  <th className="py-3 pr-3 text-right">Selling</th>
                  <th className="py-3 pr-3 text-right">Middle</th>
                  <th className="py-3 pr-3 text-right">Change</th>
                  <th className="py-3 pr-3 text-right">High</th>
                  <th className="py-3 text-right">Low</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, idx) => (
                  <tr key={row.symbol} className={`border-b border-border/60 ${idx % 2 === 1 ? 'bg-card' : ''}`}>
                    <td className="py-3 pr-3">
                      <span className="mr-2 text-base">{row.flag}</span>
                      <span className="font-bold text-fg">{row.symbol}</span>
                      <span className="ml-2 text-xs text-muted">{row.currencyCode}</span>
                    </td>
                    <td className="py-3 pr-3 text-right font-semibold tabular-nums text-fg">{formatPrice(row.buying, 2)}</td>
                    <td className="py-3 pr-3 text-right font-semibold tabular-nums text-fg">{formatPrice(row.selling, 2)}</td>
                    <td className="py-3 pr-3 text-right tabular-nums text-muted">{formatPrice(row.middle, 2)}</td>
                    <td
                      className={`py-3 pr-3 text-right font-semibold tabular-nums ${row.changePct >= 0 ? 'text-up' : 'text-down'}`}
                    >
                      {formatPercent(row.changePct)}
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums text-muted">{formatPrice(row.high, 2)}</td>
                    <td className="py-3 text-right tabular-nums text-muted">{formatPrice(row.low, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="mt-8 flex flex-col gap-6 border-t border-border pt-5 text-xs text-muted sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-md">
              Rates are indicative and may change without notice. Amounts are settled at the rate confirmed at the time of
              the transaction. Powered by Rhino Capital Markets.
            </p>
            <div className="w-48 border-t border-fg pt-1 text-center text-fg">Authorised signature</div>
          </footer>
        </article>
      </Modal>

      {showPaywall && <BillingModal reason="print" onClose={() => setShowPaywall(false)} />}
    </>
  );
}

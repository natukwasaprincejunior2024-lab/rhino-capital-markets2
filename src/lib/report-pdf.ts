import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPercent, formatPrice, type DailyReport } from '@/lib/market-data';

interface ReportPdfHeader {
  bureauName: string;
  contactLine: string | null;
  issuedAt: string;
}

const MARGIN = 40;
const INK: [number, number, number] = [10, 10, 10];
const ACCENT: [number, number, number] = [245, 158, 11];

export function buildReportPdf(report: DailyReport, header: ReportPdfHeader): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(header.bureauName.toUpperCase(), MARGIN, MARGIN);

  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text('Daily Foreign Exchange Rates', MARGIN, MARGIN + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  let y = MARGIN + 42;
  if (header.contactLine) {
    doc.text(header.contactLine, MARGIN, y);
    y += 14;
  }
  doc.text(`Date: ${report.date}    Issued: ${header.issuedAt} EAT`, MARGIN, y);

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(1.5);
  doc.line(MARGIN, y + 10, doc.internal.pageSize.getWidth() - MARGIN, y + 10);

  autoTable(doc, {
    startY: y + 24,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Currency', 'Buying', 'Selling', 'Middle', 'Change', 'High', 'Low']],
    body: report.rows.map((row) => [
      `${row.symbol} (${row.currencyCode})`,
      formatPrice(row.buying, 2),
      formatPrice(row.selling, 2),
      formatPrice(row.middle, 2),
      formatPercent(row.changePct),
      formatPrice(row.high, 2),
      formatPrice(row.low, 2),
    ]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: INK, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
    },
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    'Rates are indicative and may change without notice. Amounts are settled at the rate confirmed at the time of the transaction.',
    MARGIN,
    pageHeight - 40,
  );

  return doc;
}

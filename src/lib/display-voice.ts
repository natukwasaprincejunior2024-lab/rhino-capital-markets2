import { formatPrice, type DailyReportRow } from '@/lib/market-data';

export const VOICE_INTERVAL_MS = 5 * 60 * 1000;

export function buildRateAnnouncement(rows: DailyReportRow[]): string {
  const lines = rows.map(
    (row) =>
      `${row.symbol.replace('/', ' to ')}: buying ${formatPrice(row.buying, 2)}, selling ${formatPrice(row.selling, 2)}.`,
  );
  return ["Today's exchange rates.", ...lines].join(' ');
}

export function speakText(text: string): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

export function stopSpeaking(): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}

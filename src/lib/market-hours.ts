export function isForexOpen(now: Date): boolean {
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 6) return false;
  if (day === 0) return hour >= 22;
  if (day === 5) return hour < 22;
  return true;
}

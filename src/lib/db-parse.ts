export function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) throw new Error('Received an invalid number from the server.');
  return n;
}

export function toText(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Received unexpected data from the server.');
  return value;
}

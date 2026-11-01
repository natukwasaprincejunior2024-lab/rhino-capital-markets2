export type TradeSide = 'buy' | 'sell';

export function positionSize(balance: number, riskPct: number, entry: number, stop: number): number {
  const distance = Math.abs(entry - stop);
  if (distance === 0) return 0;
  return (balance * riskPct) / 100 / distance;
}

export function profitLoss(side: TradeSide, entry: number, exit: number, units: number): number {
  const move = side === 'buy' ? exit - entry : entry - exit;
  return move * units;
}

export function riskReward(entry: number, stop: number, target: number): number | null {
  const risk = Math.abs(entry - stop);
  if (risk === 0) return null;
  return Math.abs(target - entry) / risk;
}

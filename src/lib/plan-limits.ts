import type { BillingStatus } from '@/lib/billing-api';

export interface PlanLimits {
  pairLimit: number | null;
  priceDelayMs: number;
  maxLeverage: number | null;
  indicatorsUnlocked: boolean;
}

const FREE_LIMITS: PlanLimits = {
  pairLimit: 3,
  priceDelayMs: 15_000,
  maxLeverage: 20,
  indicatorsUnlocked: false,
};

const PAID_LIMITS: PlanLimits = {
  pairLimit: null,
  priceDelayMs: 0,
  maxLeverage: null,
  indicatorsUnlocked: true,
};

export function planLimits(billing: Pick<BillingStatus, 'isPro' | 'isTrialActive'> | null): PlanLimits {
  return billing && (billing.isPro || billing.isTrialActive) ? PAID_LIMITS : FREE_LIMITS;
}

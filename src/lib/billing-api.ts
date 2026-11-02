import { supabase } from '@/lib/supabase';

export type BillingPlan = 'free' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ProductKey =
  | 'print_1'
  | 'print_10'
  | 'print_50'
  | 'display_hour'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly';

export interface BillingStatus {
  plan: BillingPlan;
  isPro: boolean;
  isElite: boolean;
  planPeriodEnd: string | null;
  trialEndsAt: string | null;
  isTrialActive: boolean;
  printCredits: number;
  freePrintAvailable: boolean;
  displayPaidUntil: string | null;
  displayFreeUntil: string | null;
}

export type DisplayAccess = 'unlimited' | 'paid' | 'free' | 'denied';

export interface DisplaySession {
  access: DisplayAccess;
  expiresAt: string | null;
}

const PLANS: BillingPlan[] = ['free', 'daily', 'weekly', 'monthly', 'yearly'];
const DISPLAY_ACCESS: DisplayAccess[] = ['unlimited', 'paid', 'free', 'denied'];
const UNEXPECTED = 'The billing service returned an unexpected response.';

function optionalText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function parseBillingStatus(data: unknown): BillingStatus {
  if (!data || typeof data !== 'object') throw new Error(UNEXPECTED);
  const row = data as Record<string, unknown>;
  const plan = PLANS.find((p) => p === row.plan);
  if (
    !plan ||
    typeof row.isPro !== 'boolean' ||
    typeof row.isElite !== 'boolean' ||
    typeof row.isTrialActive !== 'boolean' ||
    typeof row.freePrintAvailable !== 'boolean' ||
    typeof row.printCredits !== 'number'
  ) {
    throw new Error(UNEXPECTED);
  }
  return {
    plan,
    isPro: row.isPro,
    isElite: row.isElite,
    planPeriodEnd: optionalText(row.planPeriodEnd),
    trialEndsAt: optionalText(row.trialEndsAt),
    isTrialActive: row.isTrialActive,
    printCredits: row.printCredits,
    freePrintAvailable: row.freePrintAvailable,
    displayPaidUntil: optionalText(row.displayPaidUntil),
    displayFreeUntil: optionalText(row.displayFreeUntil),
  };
}

export async function fetchBillingStatus(): Promise<BillingStatus> {
  const { data, error } = await supabase.rpc('get_billing_status');
  if (error) throw new Error(error.message);
  return parseBillingStatus(data);
}

export async function consumePrintCredit(): Promise<boolean> {
  const { data, error } = await supabase.rpc('consume_print_credit');
  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object' || typeof (data as Record<string, unknown>).allowed !== 'boolean') {
    throw new Error(UNEXPECTED);
  }
  return (data as { allowed: boolean }).allowed;
}

export async function openDisplaySession(): Promise<DisplaySession> {
  const { data, error } = await supabase.rpc('open_display_session');
  if (error) throw new Error(error.message);
  if (!data || typeof data !== 'object') throw new Error(UNEXPECTED);
  const row = data as Record<string, unknown>;
  if (typeof row.access !== 'string' || !DISPLAY_ACCESS.includes(row.access as DisplayAccess)) {
    throw new Error(UNEXPECTED);
  }
  return { access: row.access as DisplayAccess, expiresAt: optionalText(row.expiresAt) };
}

export function alertLimit(billing: Pick<BillingStatus, 'plan' | 'isPro' | 'isTrialActive'>): number | null {
  if (billing.isTrialActive || billing.isPro) {
    return billing.plan === 'daily' ? 5 : billing.plan === 'weekly' ? 20 : null;
  }
  return 0;
}

export async function startCheckout(product: ProductKey, quantity = 1): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error('Please sign in to continue.');

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/billing-checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ product, quantity }),
  });
  const body: unknown = await response.json().catch(() => null);
  const payload = (body ?? {}) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Could not start checkout. Please try again.');
  }
  if (typeof payload.url !== 'string') throw new Error(UNEXPECTED);
  window.location.assign(payload.url);
}

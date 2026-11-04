import type { ProductKey } from '@/lib/billing-api';

export type PaidPlanId = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface PaidPlan {
  id: PaidPlanId;
  label: string;
  price: string;
  period: string;
  note: string;
  badge: 'Popular' | 'Best value' | 'Elite' | null;
  features: string[];
}

export const PAID_PLANS: PaidPlan[] = [
  {
    id: 'daily',
    label: 'Daily',
    price: '$1.99',
    period: 'per day',
    note: 'Pay as you go, day by day',
    badge: null,
    features: [
      'All Pro features',
      '24 live currency pairs, updated every 2 seconds',
      'All chart indicators',
      'Up to 500x leverage',
      'Order book',
      'Margin risk calendar and news',
      '5 price alerts',
      'Unlimited prints',
      'Unlimited display board',
    ],
  },
  {
    id: 'weekly',
    label: 'Weekly',
    price: '$5.99',
    period: 'per week',
    note: 'Save 15% on the daily rate',
    badge: 'Popular',
    features: ['Everything in Daily', '20 price alerts', 'M-Pesa payments', 'WhatsApp sharing', 'Audit trail'],
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$9.99',
    period: 'per month',
    note: 'Save 40% on the daily rate',
    badge: 'Best value',
    features: [
      'Everything in Weekly',
      'Unlimited price alerts',
      'Copy trading',
      'Webhooks',
      'Priority support',
      'Unlimited bureau',
      'BOU report',
      'Offline app (install on your device)',
    ],
  },
  {
    id: 'yearly',
    label: 'Yearly',
    price: '$79.99',
    period: 'per year',
    note: 'Save 33%: $6.66 a month',
    badge: 'Elite',
    features: [
      'Everything in Monthly',
      'API access',
      'Whale alerts',
      'Correlation analysis',
      'White label',
      'Free API calls',
      'One-on-one onboarding call',
    ],
  },
];

export const FREE_FEATURES: string[] = [
  '3 currency pairs, prices delayed 15 seconds',
  '1-hour and 1-day moving average only',
  'Up to 20x leverage',
  'No order book',
  'No price alerts',
  'One free print, then $0.10 a print',
  '30 minutes of display board a day, then $0.10 an hour',
];

export interface PrintPack {
  product: Extract<ProductKey, 'print_1' | 'print_10' | 'print_50'>;
  prints: number;
  price: string;
  ugx: string;
  saving: string | null;
}

export const PRINT_PACKS: PrintPack[] = [
  { product: 'print_1', prints: 1, price: '$0.10', ugx: 'UGX 370', saving: null },
  { product: 'print_10', prints: 10, price: '$0.80', ugx: 'UGX 2,960', saving: 'Save 20%' },
  { product: 'print_50', prints: 50, price: '$3.00', ugx: 'UGX 11,100', saving: 'Save 40%' },
];

export const DISPLAY_HOUR = { price: '$0.10', ugx: 'UGX 370' } as const;

export const DISPLAY_HOUR_OPTIONS = [1, 2, 4, 8] as const;

export const MOMO_MERCHANT = {
  number: '0783554841',
  merchantCode: '074583',
  name: 'NATUKWASA LINDON - RHINO CAPITAL MARKETS',
} as const;

export const MOMO_PRICES_UGX: Record<ProductKey, number> = {
  print_1: 370,
  print_10: 2960,
  print_50: 11100,
  display_hour: 370,
  daily: 7400,
  weekly: 22200,
  monthly: 37000,
  yearly: 296000,
};

export const PLAN_LABELS: Record<'free' | PaidPlanId, string> = {
  free: 'Free',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

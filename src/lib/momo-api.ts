import { supabase } from '@/lib/supabase';
import type { ProductKey } from '@/lib/billing-api';

const TRANSACTION_ID_PATTERN = /^[A-Za-z0-9-]{4,64}$/;

export interface MomoSubmission {
  product: ProductKey;
  quantity: number;
  amountUgx: number;
  transactionId: string;
}

export function normalizeTransactionId(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidTransactionId(value: string): boolean {
  return TRANSACTION_ID_PATTERN.test(normalizeTransactionId(value));
}

export async function submitMomoPayment(submission: MomoSubmission): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (userError || !userId) throw new Error('Please sign in to continue.');

  const { error } = await supabase.from('momo_payments').insert({
    user_id: userId,
    product: submission.product,
    quantity: submission.quantity,
    amount_ugx: submission.amountUgx,
    transaction_id: normalizeTransactionId(submission.transactionId),
  });

  if (error) {
    if (error.code === '23505') throw new Error('This transaction ID has already been submitted.');
    throw new Error('Could not submit your payment. Please try again.');
  }
}

import { supabase } from '@/lib/supabase';
import { toNumber, toText } from '@/lib/db-parse';
import type { TransactionType } from '@/lib/market-data';

export interface BureauProfile {
  name: string;
  address: string;
  phone: string;
}

export const EMPTY_BUREAU_PROFILE: BureauProfile = { name: '', address: '', phone: '' };

export interface RateRow {
  symbol: string;
  buying: number;
  selling: number;
}

export interface TransactionRow {
  id: string;
  symbol: string;
  type: TransactionType;
  amount: number;
  rate: number;
  total: number;
  customer: string;
  createdAt: string;
}

export interface NewTransaction {
  symbol: string;
  type: TransactionType;
  amount: number;
  rate: number;
  total: number;
  customer: string;
}

interface RateDbRow {
  symbol: unknown;
  buying: unknown;
  selling: unknown;
}

interface TransactionDbRow {
  id: unknown;
  symbol: unknown;
  type: unknown;
  amount: unknown;
  rate: unknown;
  total: unknown;
  customer: unknown;
  created_at: unknown;
}

function parseRate(row: RateDbRow): RateRow {
  return { symbol: toText(row.symbol), buying: toNumber(row.buying), selling: toNumber(row.selling) };
}

interface ProfileDbRow {
  name: unknown;
  address: unknown;
  phone: unknown;
}

function parseProfile(row: ProfileDbRow): BureauProfile {
  return { name: toText(row.name), address: toText(row.address), phone: toText(row.phone) };
}

function parseTransaction(row: TransactionDbRow): TransactionRow {
  const type = row.type === 'buy' || row.type === 'sell' ? row.type : null;
  if (!type) throw new Error('Received an unknown transaction type from the server.');
  return {
    id: toText(row.id),
    symbol: toText(row.symbol),
    type,
    amount: toNumber(row.amount),
    rate: toNumber(row.rate),
    total: toNumber(row.total),
    customer: typeof row.customer === 'string' ? row.customer : '',
    createdAt: toText(row.created_at),
  };
}

export async function fetchRates(): Promise<RateRow[]> {
  const { data, error } = await supabase
    .from('bureau_rates')
    .select('symbol, buying, selling');
  if (error) throw new Error(error.message);
  return (data ?? []).map(parseRate);
}

export async function saveRates(rates: RateRow[]): Promise<void> {
  const { error } = await supabase
    .from('bureau_rates')
    .upsert(rates, { onConflict: 'user_id,symbol' });
  if (error) throw new Error(error.message);
}

export async function fetchTransactions(limit = 100): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from('bureau_transactions')
    .select('id, symbol, type, amount, rate, total, customer, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(parseTransaction);
}

export async function addTransaction(input: NewTransaction): Promise<TransactionRow> {
  const { data, error } = await supabase
    .from('bureau_transactions')
    .insert(input)
    .select('id, symbol, type, amount, rate, total, customer, created_at')
    .single();
  if (error) throw new Error(error.message);
  return parseTransaction(data);
}

export async function fetchBureauProfile(): Promise<BureauProfile> {
  const { data, error } = await supabase
    .from('bureau_profiles')
    .select('name, address, phone')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return EMPTY_BUREAU_PROFILE;
  return parseProfile(data);
}

export async function saveBureauProfile(profile: BureauProfile): Promise<void> {
  const { error } = await supabase
    .from('bureau_profiles')
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
}

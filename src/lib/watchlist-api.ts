import { supabase } from '@/lib/supabase';

export async function fetchWatchlist(): Promise<string[]> {
  const { data, error } = await supabase.from('watchlist_items').select('symbol');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    if (typeof row.symbol !== 'string') throw new Error('Received unexpected data from the server.');
    return row.symbol;
  });
}

export async function addToWatchlist(symbol: string): Promise<void> {
  const { error } = await supabase.from('watchlist_items').insert({ symbol });
  if (error) throw new Error(error.message);
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
  const { error } = await supabase.from('watchlist_items').delete().eq('symbol', symbol);
  if (error) throw new Error(error.message);
}

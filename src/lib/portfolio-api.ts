import { supabase } from '@/lib/supabase';
import { toNumber, toText } from '@/lib/db-parse';
import type { TradeSide } from '@/lib/trade-math';

export interface Position {
  id: string;
  symbol: string;
  side: TradeSide;
  units: number;
  entryPrice: number;
  openedAt: string;
}

export interface NewPosition {
  symbol: string;
  side: TradeSide;
  units: number;
  entryPrice: number;
}

const COLUMNS = 'id, symbol, side, units, entry_price, opened_at';

function parsePosition(row: Record<string, unknown>): Position {
  const side = row.side === 'buy' || row.side === 'sell' ? row.side : null;
  if (!side) throw new Error('Received an unknown position side from the server.');
  return {
    id: toText(row.id),
    symbol: toText(row.symbol),
    side,
    units: toNumber(row.units),
    entryPrice: toNumber(row.entry_price),
    openedAt: toText(row.opened_at),
  };
}

export async function fetchPositions(): Promise<Position[]> {
  const { data, error } = await supabase
    .from('portfolio_positions')
    .select(COLUMNS)
    .order('opened_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(parsePosition);
}

export async function addPosition(input: NewPosition): Promise<Position> {
  const { data, error } = await supabase
    .from('portfolio_positions')
    .insert({ symbol: input.symbol, side: input.side, units: input.units, entry_price: input.entryPrice })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return parsePosition(data);
}

export async function closePosition(id: string): Promise<void> {
  const { error } = await supabase.from('portfolio_positions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

import { supabase } from '@/lib/supabase';
import { toNumber, toText } from '@/lib/db-parse';

export type AlertDirection = 'above' | 'below';

export interface PriceAlert {
  id: string;
  symbol: string;
  direction: AlertDirection;
  target: number;
  triggeredAt: string | null;
  createdAt: string;
}

export interface NewPriceAlert {
  symbol: string;
  direction: AlertDirection;
  target: number;
}

const COLUMNS = 'id, symbol, direction, target, triggered_at, created_at';

function parseAlert(row: Record<string, unknown>): PriceAlert {
  const direction = row.direction === 'above' || row.direction === 'below' ? row.direction : null;
  if (!direction) throw new Error('Received an unknown alert direction from the server.');
  return {
    id: toText(row.id),
    symbol: toText(row.symbol),
    direction,
    target: toNumber(row.target),
    triggeredAt: typeof row.triggered_at === 'string' ? row.triggered_at : null,
    createdAt: toText(row.created_at),
  };
}

export async function fetchAlerts(): Promise<PriceAlert[]> {
  const { data, error } = await supabase
    .from('price_alerts')
    .select(COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(parseAlert);
}

export async function addAlert(input: NewPriceAlert): Promise<PriceAlert> {
  const { data, error } = await supabase
    .from('price_alerts')
    .insert(input)
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return parseAlert(data);
}

export async function deleteAlert(id: string): Promise<void> {
  const { error } = await supabase.from('price_alerts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function markAlertTriggered(id: string, triggeredAt: string): Promise<void> {
  const { error } = await supabase
    .from('price_alerts')
    .update({ triggered_at: triggeredAt })
    .eq('id', id)
    .is('triggered_at', null);
  if (error) throw new Error(error.message);
}

import { supabase } from '@/lib/supabase';
import { toText } from '@/lib/db-parse';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

const COLUMNS = 'id, title, body, read_at, created_at';

function parseNotification(row: Record<string, unknown>): AppNotification {
  return {
    id: toText(row.id),
    title: toText(row.title),
    body: typeof row.body === 'string' ? row.body : '',
    readAt: typeof row.read_at === 'string' ? row.read_at : null,
    createdAt: toText(row.created_at),
  };
}

export async function fetchNotifications(limit = 30): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(parseNotification);
}

export async function addNotification(title: string, body: string): Promise<AppNotification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ title, body })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return parseNotification(data);
}

export async function markAllNotificationsRead(readAt: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: readAt })
    .is('read_at', null);
  if (error) throw new Error(error.message);
}

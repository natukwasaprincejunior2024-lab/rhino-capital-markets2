import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addNotification,
  fetchNotifications,
  markAllNotificationsRead,
  type AppNotification,
} from '@/lib/notifications-api';

function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchNotifications());
    } catch (err) {
      setError(messageOf(err, 'Could not load your notifications.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const notify = useCallback(async (title: string, body: string) => {
    try {
      const created = await addNotification(title, body);
      setItems((prev) => [created, ...prev]);
    } catch (err) {
      setError(messageOf(err, 'Could not save a notification.'));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString();
    try {
      await markAllNotificationsRead(readAt);
      setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt })));
    } catch (err) {
      setError(messageOf(err, 'Could not mark notifications as read.'));
    }
  }, []);

  const unreadCount = useMemo(() => items.filter((n) => !n.readAt).length, [items]);

  return { items, unreadCount, loading, error, notify, markAllRead, reload: load };
}

export type NotificationCenter = ReturnType<typeof useNotifications>;

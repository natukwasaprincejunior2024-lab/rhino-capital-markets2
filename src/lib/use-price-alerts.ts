import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addAlert,
  deleteAlert,
  fetchAlerts,
  markAlertTriggered,
  type NewPriceAlert,
  type PriceAlert,
} from '@/lib/alerts-api';
import type { Instrument } from '@/lib/market-data';

export function usePriceAlerts(
  instruments: Instrument[],
  onTriggered: (alert: PriceAlert, price: number) => void
) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firing = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    fetchAlerts()
      .then((list) => {
        if (active) setAlerts(list);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your price alerts.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const prices = new Map(instruments.map((i) => [i.symbol, i.price]));
    for (const alert of alerts) {
      if (alert.triggeredAt || firing.current.has(alert.id)) continue;
      const price = prices.get(alert.symbol);
      if (price === undefined) continue;
      const crossed = alert.direction === 'above' ? price >= alert.target : price <= alert.target;
      if (!crossed) continue;

      firing.current.add(alert.id);
      const triggeredAt = new Date().toISOString();
      markAlertTriggered(alert.id, triggeredAt)
        .then(() => {
          setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, triggeredAt } : a)));
          onTriggered({ ...alert, triggeredAt }, price);
        })
        .catch((err: unknown) => {
          firing.current.delete(alert.id);
          setError(err instanceof Error ? err.message : 'Could not update a price alert.');
        });
    }
  }, [instruments, alerts, onTriggered]);

  const add = useCallback(async (input: NewPriceAlert) => {
    const created = await addAlert(input);
    setAlerts((prev) => [created, ...prev]);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { alerts, loading, error, add, remove };
}

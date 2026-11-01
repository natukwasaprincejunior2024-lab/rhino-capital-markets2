import { useCallback, useEffect, useState } from 'react';
import { addPosition, closePosition, fetchPositions, type NewPosition, type Position } from '@/lib/portfolio-api';

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchPositions()
      .then((list) => {
        if (active) setPositions(list);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your positions.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const add = useCallback(async (input: NewPosition) => {
    const created = await addPosition(input);
    setPositions((prev) => [created, ...prev]);
  }, []);

  const close = useCallback(async (id: string) => {
    await closePosition(id);
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { positions, loading, error, add, close };
}

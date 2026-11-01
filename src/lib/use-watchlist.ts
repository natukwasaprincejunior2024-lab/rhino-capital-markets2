import { useCallback, useEffect, useState } from 'react';
import { addToWatchlist, fetchWatchlist, removeFromWatchlist } from '@/lib/watchlist-api';

export function useWatchlist() {
  const [symbols, setSymbols] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchWatchlist()
      .then((list) => {
        if (active) setSymbols(new Set(list));
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your watchlist.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback(
    async (symbol: string) => {
      const watched = symbols.has(symbol);
      setError(null);
      try {
        if (watched) {
          await removeFromWatchlist(symbol);
        } else {
          await addToWatchlist(symbol);
        }
        setSymbols((prev) => {
          const next = new Set(prev);
          if (watched) next.delete(symbol);
          else next.add(symbol);
          return next;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not update your watchlist.');
      }
    },
    [symbols]
  );

  return { symbols, loading, error, toggle };
}

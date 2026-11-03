import { useEffect, useRef, useState } from 'react';
import type { Instrument } from '@/lib/market-data';

interface QuoteSnapshot {
  at: number;
  instruments: Instrument[];
}

export function useDelayedQuotes(instruments: Instrument[], delayMs: number): Instrument[] {
  const [delayed, setDelayed] = useState(instruments);
  const history = useRef<QuoteSnapshot[]>([]);

  useEffect(() => {
    if (delayMs <= 0) return;
    const now = Date.now();
    history.current.push({ at: now, instruments });
    const cutoff = now - delayMs;
    let keep = 0;
    history.current.forEach((snapshot, index) => {
      if (snapshot.at <= cutoff) keep = index;
    });
    history.current = history.current.slice(keep);
    setDelayed(history.current[0].instruments);
  }, [instruments, delayMs]);

  return delayMs <= 0 ? instruments : delayed;
}

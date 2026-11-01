import { useEffect, useState } from 'react';
import { INSTRUMENTS, tickInstrument, type Instrument } from '@/lib/market-data';

export function useLiveMarkets(intervalMs = 2000): Instrument[] {
  const [instruments, setInstruments] = useState<Instrument[]>(INSTRUMENTS);

  useEffect(() => {
    const id = window.setInterval(() => {
      setInstruments((prev) => prev.map(tickInstrument));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return instruments;
}

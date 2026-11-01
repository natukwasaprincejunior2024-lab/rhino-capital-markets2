import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { bureauContactLine, bureauDisplayName, BUREAU_TIME_ZONE } from '@/lib/bureau-info';
import { fetchPublicBoard, type PublicBoard } from '@/lib/display-links-api';
import { formatPrice, INSTRUMENTS_BY_SYMBOL } from '@/lib/market-data';

const REFRESH_MS = 60_000;
const ROW_GRID = 'grid grid-cols-[1.6fr_1fr_1fr] items-center gap-4';

interface PublicDisplayPageProps {
  token: string;
}

export default function PublicDisplayPage({ token }: PublicDisplayPageProps) {
  const [board, setBoard] = useState<PublicBoard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setBoard(await fetchPublicBoard(token));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The board could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 size={28} className="animate-spin text-brand" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-6 text-center text-white">
        <AlertTriangle size={32} className="text-down" />
        <p className="text-xl font-bold">{error ?? 'This board is not available.'}</p>
        <p className="text-sm text-neutral-400">Ask the bureau for a new link.</p>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-700 px-4 text-sm font-semibold text-neutral-200 transition-colors duration-200 hover:border-brand hover:text-brand"
        >
          <RefreshCw size={16} /> Try again
        </button>
      </div>
    );
  }

  const bureauName = bureauDisplayName(board.profile);
  const contactLine = bureauContactLine(board.profile);
  const updatedText = board.updatedAt
    ? new Date(board.updatedAt).toLocaleString('en-GB', {
        timeZone: BUREAU_TIME_ZONE,
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-ink text-white">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-brand/30 px-6 py-8 md:px-12">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand">{bureauName}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-5xl">Today's Exchange Rates</h1>
          {contactLine && <p className="mt-2 text-sm text-neutral-400">{contactLine}</p>}
        </div>
        <p className="flex items-center gap-2 text-sm font-bold text-up">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-up" /> LIVE
          {updatedText && <span className="font-normal text-neutral-400">Updated {updatedText}</span>}
        </p>
      </header>

      <div className={`${ROW_GRID} px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 md:px-12`}>
        <span>Currency</span>
        <span className="text-right">Buying</span>
        <span className="text-right">Selling</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {board.rates.length === 0 && (
          <p className="px-6 py-12 text-center text-neutral-400 md:px-12">No rates have been published yet.</p>
        )}
        {board.rates.map((rate, idx) => {
          const instrument = INSTRUMENTS_BY_SYMBOL[rate.symbol];
          return (
            <div
              key={rate.symbol}
              className={`${ROW_GRID} min-h-[80px] px-6 md:px-12 ${idx % 2 === 1 ? 'bg-neutral-900' : ''}`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{instrument?.flag ?? ''}</span>
                <div>
                  <p className="text-2xl font-extrabold md:text-3xl">{rate.symbol}</p>
                  <p className="text-sm text-neutral-400">{instrument?.name ?? ''}</p>
                </div>
              </div>
              <p className="text-right text-2xl font-extrabold tabular-nums md:text-3xl">{formatPrice(rate.buying, 2)}</p>
              <p className="text-right text-2xl font-extrabold tabular-nums text-brand md:text-3xl">{formatPrice(rate.selling, 2)}</p>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="border-t border-neutral-800 px-6 py-3 text-sm text-down md:px-12">
          Could not refresh the rates. Showing the last update.
        </p>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import MarketTable from '@/components/MarketTable';
import { changePercent, searchInstruments, type Instrument } from '@/lib/market-data';

type FilterId =
  | 'all'
  | 'watchlist'
  | 'forex'
  | 'crypto'
  | 'stock'
  | 'commodities'
  | 'africa'
  | 'bonds'
  | 'etfs'
  | 'gainers'
  | 'losers';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'forex', label: 'Forex' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'stock', label: 'Stocks' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'africa', label: 'Africa' },
  { id: 'bonds', label: 'Bonds' },
  { id: 'etfs', label: 'ETFs' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'losers', label: 'Losers' },
];

interface LiveMarketsTabProps {
  instruments: Instrument[];
  search: string;
  watchlist: ReadonlySet<string>;
  watchlistError: string | null;
  onToggleWatch: (symbol: string) => void;
}

function applyFilter(list: Instrument[], filter: FilterId, watchlist: ReadonlySet<string>): Instrument[] {
  if (filter === 'all') return list;
  if (filter === 'watchlist') return list.filter((i) => watchlist.has(i.symbol));
  if (filter === 'gainers') {
    return list
      .filter((i) => changePercent(i.price, i.prevPrice) > 0)
      .sort((a, b) => changePercent(b.price, b.prevPrice) - changePercent(a.price, a.prevPrice));
  }
  if (filter === 'losers') {
    return list
      .filter((i) => changePercent(i.price, i.prevPrice) < 0)
      .sort((a, b) => changePercent(a.price, a.prevPrice) - changePercent(b.price, b.prevPrice));
  }
  return list.filter((i) => i.assetClass === filter);
}

export default function LiveMarketsTab({
  instruments,
  search,
  watchlist,
  watchlistError,
  onToggleWatch,
}: LiveMarketsTabProps) {
  const [filter, setFilter] = useState<FilterId>('all');

  const visible = useMemo(
    () => applyFilter(searchInstruments(instruments, search), filter, watchlist),
    [instruments, search, filter, watchlist]
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-fg">Live Markets</h1>
            <span className="rounded-full bg-up/15 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-up">LIVE</span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Streaming quotes across {instruments.length} instruments, refreshed every 2 seconds.
          </p>
        </div>
        <p className="text-sm tabular-nums text-muted">
          Showing <span className="font-semibold text-fg">{visible.length}</span> of {instruments.length}
        </p>
      </div>

      {watchlistError && (
        <p className="rounded-lg border border-down/40 bg-down/10 px-4 py-3 text-sm text-down">
          {watchlistError}
        </p>
      )}

      <div role="tablist" aria-label="Market filters" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                active
                  ? 'border-brand bg-brand text-ink'
                  : 'border-border bg-card text-muted hover:border-brand/60 hover:text-fg'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <MarketTable instruments={visible} watchlist={watchlist} onToggleWatch={onToggleWatch} />
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import PriceChange from '@/components/PriceChange';
import {
  ASSET_CLASS_LABELS,
  formatCompact,
  formatPrice,
  type Instrument,
} from '@/lib/market-data';

interface MarketTableProps {
  instruments: Instrument[];
  watchlist: ReadonlySet<string>;
  onToggleWatch: (symbol: string) => void;
}

interface Flash {
  dir: 'up' | 'down';
  id: number;
}

function usePriceFlash(price: number): Flash | null {
  const [flash, setFlash] = useState<Flash | null>(null);
  const last = useRef(price);
  useEffect(() => {
    if (price === last.current) return;
    setFlash({ dir: price > last.current ? 'up' : 'down', id: Date.now() });
    last.current = price;
  }, [price]);
  return flash;
}

export default function MarketTable({ instruments, watchlist, onToggleWatch }: MarketTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[720px] text-sm lg:min-w-[1000px]">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted">
            <th className="w-12 px-4 py-3 text-left font-semibold">
              <span className="sr-only">Watch</span>
            </th>
            <th className="px-4 py-3 text-left font-semibold">Symbol</th>
            <th className="px-4 py-3 text-right font-semibold">Price</th>
            <th className="px-4 py-3 text-right font-semibold">Change</th>
            <th className="hidden px-4 py-3 text-right font-semibold md:table-cell">High</th>
            <th className="hidden px-4 py-3 text-right font-semibold md:table-cell">Low</th>
            <th className="hidden px-4 py-3 text-right font-semibold lg:table-cell">Volume</th>
            <th className="hidden px-4 py-3 text-right font-semibold lg:table-cell">Spread</th>
            <th className="hidden px-4 py-3 text-right font-semibold lg:table-cell">Leverage</th>
            <th className="px-4 py-3 text-right font-semibold">Buying</th>
            <th className="px-4 py-3 text-right font-semibold">Selling</th>
          </tr>
        </thead>
        <tbody>
          {instruments.map((i) => (
            <MarketRow
              key={i.symbol}
              instrument={i}
              watched={watchlist.has(i.symbol)}
              onToggleWatch={onToggleWatch}
            />
          ))}
          {instruments.length === 0 && (
            <tr>
              <td colSpan={11} className="px-4 py-12 text-center text-sm text-muted">
                No instruments match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MarketRow({
  instrument: i,
  watched,
  onToggleWatch,
}: {
  instrument: Instrument;
  watched: boolean;
  onToggleWatch: (symbol: string) => void;
}) {
  const flash = usePriceFlash(i.price);
  const flashClass = flash ? (flash.dir === 'up' ? 'animate-flash-up' : 'animate-flash-down') : '';

  return (
    <tr className="border-b border-border/60 transition-colors last:border-0 hover:bg-border/30">
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onToggleWatch(i.symbol)}
          aria-label={watched ? `Remove ${i.symbol} from watchlist` : `Add ${i.symbol} to watchlist`}
          aria-pressed={watched}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 hover:bg-border/50 ${
            watched ? 'text-gold' : 'text-muted hover:text-fg'
          }`}
        >
          <Star size={16} fill={watched ? 'currentColor' : 'none'} />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">{i.flag}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-fg">{i.symbol}</span>
              <span className="rounded bg-border/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                {ASSET_CLASS_LABELS[i.assetClass]}
              </span>
            </div>
            <p className="truncate text-xs text-muted">{i.name}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        <span key={flash?.id} className={`inline-block rounded px-1.5 py-0.5 font-semibold text-fg ${flashClass}`}>
          {formatPrice(i.price, i.decimals)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <PriceChange price={i.price} prevPrice={i.prevPrice} />
      </td>
      <td className="hidden px-4 py-3 text-right tabular-nums text-muted md:table-cell">{formatPrice(i.high, i.decimals)}</td>
      <td className="hidden px-4 py-3 text-right tabular-nums text-muted md:table-cell">{formatPrice(i.low, i.decimals)}</td>
      <td className="hidden px-4 py-3 text-right tabular-nums text-muted lg:table-cell">{formatCompact(i.volume)}</td>
      <td className="hidden px-4 py-3 text-right tabular-nums text-muted lg:table-cell">{formatPrice(i.spread, i.decimals)}</td>
      <td className="hidden px-4 py-3 text-right font-semibold tabular-nums text-gold lg:table-cell">{i.leverage}x</td>
      <td className="px-4 py-3 text-right tabular-nums text-fg">{formatPrice(i.buying, i.decimals)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-fg">{formatPrice(i.selling, i.decimals)}</td>
    </tr>
  );
}

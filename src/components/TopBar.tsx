import { useState } from 'react';
import { Landmark, Search, X } from 'lucide-react';
import AccountMenu from '@/components/AccountMenu';
import NotificationsMenu from '@/components/NotificationsMenu';
import PlanStatus from '@/components/PlanStatus';
import ThemeChanger from '@/components/ThemeChanger';
import { formatPrice, searchInstruments, INSTRUMENTS, type Instrument } from '@/lib/market-data';
import type { NotificationCenter } from '@/lib/use-notifications';

interface TopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  notifications: NotificationCenter;
}

export default function TopBar({ search, onSearchChange, notifications }: TopBarProps) {
  const [focused, setFocused] = useState(false);
  const suggestions: Instrument[] = search.trim() ? searchInstruments(INSTRUMENTS, search).slice(0, 6) : [];
  const showSuggestions = focused && suggestions.length > 0;

  const pick = (symbol: string) => {
    onSearchChange(symbol);
    setFocused(false);
  };

  return (
    <header className="h-16 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-4 px-4 lg:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-ink">
            <Landmark size={20} strokeWidth={2.5} />
          </div>
          <div className="hidden leading-none md:block">
            <p className="text-sm font-extrabold tracking-wide text-fg">RHINO</p>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-muted">CAPITAL MARKETS</p>
          </div>
        </div>

        <div className="relative max-w-md flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onSearchChange('');
              if (e.key === 'Enter' && suggestions[0]) pick(suggestions[0].symbol);
            }}
            placeholder="Search symbol, currency or name"
            aria-label="Search markets"
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-9 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:text-fg"
            >
              <X size={14} />
            </button>
          )}

          {showSuggestions && (
            <ul className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
              {suggestions.map((i) => (
                <li key={i.symbol}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(i.symbol);
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-border/50"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>{i.flag}</span>
                      <span className="font-semibold text-fg">{i.symbol}</span>
                      <span className="hidden text-xs text-muted sm:inline">{i.name}</span>
                    </span>
                    <span className="tabular-nums text-muted">{formatPrice(i.price, i.decimals)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <NotificationsMenu center={notifications} />
          <ThemeChanger />
          <PlanStatus />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

import { useCallback, useEffect, useState } from 'react';
import AnalyticsTab from '@/components/AnalyticsTab';
import BureauTab from '@/components/BureauTab';
import ChartsTab from '@/components/ChartsTab';
import LiveMarketsTab from '@/components/LiveMarketsTab';
import MarketStatusBar from '@/components/MarketStatusBar';
import PortfolioTab from '@/components/PortfolioTab';
import TickerBanner from '@/components/TickerBanner';
import TopBar from '@/components/TopBar';
import type { PriceAlert } from '@/lib/alerts-api';
import { useAuth } from '@/lib/auth-context';
import { formatPrice, INSTRUMENTS_BY_SYMBOL } from '@/lib/market-data';
import { planLimits } from '@/lib/plan-limits';
import { useDelayedQuotes } from '@/lib/use-delayed-quotes';
import { useLiveMarkets } from '@/lib/use-live-markets';
import { useNotifications } from '@/lib/use-notifications';
import { usePriceAlerts } from '@/lib/use-price-alerts';
import { useWatchlist } from '@/lib/use-watchlist';

type Section = 'markets' | 'charts' | 'analytics' | 'portfolio' | 'bureau';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'markets', label: 'Live Markets' },
  { id: 'charts', label: 'Charts' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'bureau', label: 'Forex Bureau' },
];

export default function Dashboard() {
  const instruments = useLiveMarkets();
  const { billing } = useAuth();
  const limits = planLimits(billing);
  const delayedQuotes = useDelayedQuotes(instruments, limits.priceDelayMs);
  const quotes = limits.pairLimit === null ? delayedQuotes : delayedQuotes.slice(0, limits.pairLimit);
  const watchlist = useWatchlist();
  const notifications = useNotifications();
  const { notify } = notifications;
  const [search, setSearch] = useState('');
  const [section, setSection] = useState<Section>('markets');

  const handleAlertTriggered = useCallback(
    (alert: PriceAlert, price: number) => {
      const decimals = INSTRUMENTS_BY_SYMBOL[alert.symbol]?.decimals ?? 4;
      void notify(
        `Price alert: ${alert.symbol}`,
        `${alert.symbol} reached ${formatPrice(price, decimals)}, ${alert.direction} your target of ${formatPrice(alert.target, decimals)}.`
      );
    },
    [notify]
  );
  const alerts = usePriceAlerts(instruments, handleAlertTriggered);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < SECTIONS.length) {
        setSection(SECTIONS[index].id);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="sticky top-0 z-40">
        <TickerBanner instruments={quotes} />
        <TopBar search={search} onSearchChange={setSearch} notifications={notifications} />
      </div>
      <MarketStatusBar instruments={instruments} />
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 lg:px-6 lg:py-8">
        <nav role="tablist" aria-label="Sections" className="flex gap-2 overflow-x-auto pb-1">
          {SECTIONS.map((s) => {
            const active = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSection(s.id)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  active ? 'bg-brand text-ink' : 'text-muted hover:bg-card hover:text-fg'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        {section === 'markets' && (
          <LiveMarketsTab
            instruments={quotes}
            hiddenCount={instruments.length - quotes.length}
            limits={limits}
            search={search}
            watchlist={watchlist.symbols}
            watchlistError={watchlist.error}
            onToggleWatch={(symbol) => void watchlist.toggle(symbol)}
          />
        )}
        {section === 'charts' && <ChartsTab instruments={quotes} limits={limits} />}
        {section === 'analytics' && <AnalyticsTab instruments={instruments} />}
        {section === 'portfolio' && <PortfolioTab instruments={instruments} alerts={alerts} />}
        {section === 'bureau' && <BureauTab instruments={instruments} />}
      </main>
    </div>
  );
}

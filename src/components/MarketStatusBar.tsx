import { useEffect, useState, type ReactNode } from 'react';
import PriceChange from '@/components/PriceChange';
import { BUREAU_TIME_ZONE } from '@/lib/bureau-info';
import { isForexOpen } from '@/lib/market-hours';
import { computeFearGreed, fearGreedColor, fearGreedLabel, formatPrice, type Instrument } from '@/lib/market-data';

interface MarketStatusBarProps {
  instruments: Instrument[];
}

function findBySymbol(instruments: Instrument[], symbol: string): Instrument | undefined {
  return instruments.find((i) => i.symbol === symbol);
}

function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export default function MarketStatusBar({ instruments }: MarketStatusBarProps) {
  const gold = findBySymbol(instruments, 'XAU/USD');
  const btc = findBySymbol(instruments, 'BTC/USD');
  const ugx = findBySymbol(instruments, 'USD/UGX');
  const score = computeFearGreed(instruments);
  const scoreColor = fearGreedColor(score);
  const now = useClock();
  const forexOpen = isForexOpen(now);
  const localTime = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BUREAU_TIME_ZONE,
  }).format(now);

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1600px] items-center gap-6 overflow-x-auto px-4 py-2.5 text-xs lg:px-6">
        {gold && <StatusItem label="Gold" value={formatPrice(gold.price, gold.decimals)} change={<PriceChange price={gold.price} prevPrice={gold.prevPrice} />} />}
        {btc && <StatusItem label="BTC" value={formatPrice(btc.price, btc.decimals)} change={<PriceChange price={btc.price} prevPrice={btc.prevPrice} />} />}
        {ugx && <StatusItem label="USD/UGX" value={formatPrice(ugx.price, ugx.decimals)} change={<PriceChange price={ugx.price} prevPrice={ugx.prevPrice} />} />}
        <div className="flex shrink-0 items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${forexOpen ? 'bg-up' : 'bg-down'}`} aria-hidden="true" />
          <span className="font-semibold text-fg">Forex {forexOpen ? 'open' : 'closed'}</span>
          <span className="tabular-nums text-muted">Kampala {localTime}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-muted">Fear &amp; Greed</span>
          <span className="font-extrabold tabular-nums" style={{ color: scoreColor }}>{score}</span>
          <span className="font-semibold" style={{ color: scoreColor }}>{fearGreedLabel(score)}</span>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value, change }: { label: string; value: string; change: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-muted">{label}</span>
      <span className="font-semibold tabular-nums text-fg">{value}</span>
      {change}
    </div>
  );
}

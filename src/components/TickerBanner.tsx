import { formatPrice, type Instrument } from '@/lib/market-data';
import PriceChange from '@/components/PriceChange';

interface TickerBannerProps {
  instruments: Instrument[];
}

export default function TickerBanner({ instruments }: TickerBannerProps) {
  const loop = [...instruments, ...instruments];
  return (
    <div className="flex h-9 items-center overflow-hidden border-b border-border bg-ink text-white">
      <div className="flex shrink-0 items-center gap-2 border-r border-white/10 px-4 text-[11px] font-extrabold tracking-wider">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-up" />
        </span>
        <span className="text-up">LIVE</span>
      </div>
      <div className="flex min-w-0 flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {loop.map((i, index) => (
            <div key={`${i.symbol}-${index}`} className="flex items-center gap-2 whitespace-nowrap px-5 text-xs">
              <span>{i.flag}</span>
              <span className="font-semibold text-white">{i.symbol}</span>
              <span className="tabular-nums text-white/90">{formatPrice(i.price, i.decimals)}</span>
              <PriceChange price={i.price} prevPrice={i.prevPrice} className="text-[11px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Minus, Plus, X } from 'lucide-react';
import { bureauContactLine, bureauDisplayName, BUREAU_TIME_ZONE } from '@/lib/bureau-info';
import { formatPercent, formatPrice, type DailyReportRow } from '@/lib/market-data';
import type { BureauProfile } from '@/lib/bureau-api';

interface DisplayBoardProps {
  rows: DailyReportRow[];
  profile: BureauProfile;
  onClose: () => void;
}

type FontSize = 'md' | 'lg' | 'xl';

const FONT_SIZES: FontSize[] = ['md', 'lg', 'xl'];

const SIZE_CLASSES: Record<FontSize, { cell: string; code: string }> = {
  md: { cell: 'text-2xl', code: 'text-base' },
  lg: { cell: 'text-3xl', code: 'text-lg' },
  xl: { cell: 'text-4xl md:text-5xl', code: 'text-lg md:text-2xl' },
};

const ROW_GRID = 'grid grid-cols-[1.5fr_1fr_1fr_0.9fr] items-center gap-4';

export default function DisplayBoard({ rows, profile, onClose }: DisplayBoardProps) {
  const bureauName = bureauDisplayName(profile);
  const contactLine = bureauContactLine(profile);
  const rootRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [sizeIndex, setSizeIndex] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const size = SIZE_CLASSES[FONT_SIZES[sizeIndex]];

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) onClose();
    };
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [onClose]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void rootRef.current?.requestFullscreen();
    }
  };

  const timeText = now.toLocaleTimeString('en-GB', { timeZone: BUREAU_TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateText = now.toLocaleDateString('en-GB', { timeZone: BUREAU_TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div ref={rootRef} role="dialog" aria-modal="true" aria-label="Display board" className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-ink text-white">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-brand/30 px-6 py-6 md:px-12">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-brand">{bureauName}</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight md:text-5xl">Today's Exchange Rates</h2>
          {contactLine && <p className="mt-2 text-sm text-neutral-400">{contactLine}</p>}
        </div>
        <div className="text-right">
          <p className="flex items-center justify-end gap-2 text-sm font-bold text-up">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-up" /> LIVE
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums md:text-4xl">{timeText}</p>
          <p className="text-sm text-neutral-400">{dateText}</p>
        </div>
      </header>

      <div className={`${ROW_GRID} px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 md:px-12`}>
        <span>Currency</span>
        <span className="text-right">Buying</span>
        <span className="text-right">Selling</span>
        <span className="text-right">Change</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rows.map((row, idx) => (
          <div
            key={row.symbol}
            className={`${ROW_GRID} min-h-[80px] px-6 md:px-12 ${idx % 2 === 1 ? 'bg-neutral-900' : ''}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{row.flag}</span>
              <div>
                <p className={`font-extrabold ${size.cell}`}>{row.symbol}</p>
                <p className={`text-neutral-400 ${size.code}`}>{row.currencyCode}</p>
              </div>
            </div>
            <p className={`text-right font-extrabold tabular-nums ${size.cell}`}>{formatPrice(row.buying, 2)}</p>
            <p className={`text-right font-extrabold tabular-nums text-brand ${size.cell}`}>{formatPrice(row.selling, 2)}</p>
            <p className={`text-right font-bold tabular-nums ${row.changePct >= 0 ? 'text-up' : 'text-down'} ${size.code}`}>
              {formatPercent(row.changePct)}
            </p>
          </div>
        ))}
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-neutral-800 px-6 py-3 md:px-12">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSizeIndex((i) => Math.max(0, i - 1))}
            disabled={sizeIndex === 0}
            aria-label="Smaller text"
            className="rounded-lg border border-neutral-700 p-2 text-neutral-300 transition-colors duration-200 hover:border-brand hover:text-brand disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
          <button
            type="button"
            onClick={() => setSizeIndex((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
            disabled={sizeIndex === FONT_SIZES.length - 1}
            aria-label="Larger text"
            className="rounded-lg border border-neutral-700 p-2 text-neutral-300 transition-colors duration-200 hover:border-brand hover:text-brand disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors duration-200 hover:border-brand hover:text-brand"
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors duration-200 hover:border-down hover:text-down"
          >
            <X size={14} /> Close
          </button>
        </div>
      </footer>
    </div>
  );
}

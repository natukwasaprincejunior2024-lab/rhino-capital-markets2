import { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Volume2, VolumeX, X } from 'lucide-react';
import BillingModal from '@/components/BillingModal';
import DisplayPaywall from '@/components/DisplayPaywall';
import { openDisplaySession, type DisplaySession } from '@/lib/billing-api';
import { bureauContactLine, bureauDisplayName, BUREAU_TIME_ZONE } from '@/lib/bureau-info';
import type { BureauProfile } from '@/lib/bureau-api';
import { formatPercent, formatPrice, type DailyReportRow } from '@/lib/market-data';
import { buildRateAnnouncement, speakText, stopSpeaking, VOICE_INTERVAL_MS } from '@/lib/display-voice';

interface DisplayBoardProps {
  rows: DailyReportRow[];
  profile: BureauProfile;
  onClose: () => void;
}

const ROW_GRID = 'grid grid-cols-[1.5fr_1fr_1fr_0.9fr] items-center gap-4';
const ROW_BG = ['bg-[#141414]', 'bg-[#0a0a0a]'];

function describeAccess(session: DisplaySession): string {
  const time = session.expiresAt
    ? new Date(session.expiresAt).toLocaleTimeString('en-GB', { timeZone: BUREAU_TIME_ZONE, hour: '2-digit', minute: '2-digit' })
    : null;
  if (session.access === 'unlimited') return 'Unlimited access';
  if (session.access === 'paid' && time) return `Paid time until ${time}`;
  if (session.access === 'free' && time) return `Free preview until ${time}`;
  return '';
}

export default function DisplayBoard({ rows, profile, onClose }: DisplayBoardProps) {
  const bureauName = bureauDisplayName(profile);
  const contactLine = bureauContactLine(profile);
  const rootRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef(rows);
  const [now, setNow] = useState(() => new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [session, setSession] = useState<DisplaySession | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [showBilling, setShowBilling] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);

  const isDenied = session?.access === 'denied';
  const canShow = session !== null && !isDenied;

  const refreshSession = useCallback(async () => {
    try {
      setSession(await openDisplaySession());
      setSessionError(null);
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : 'Could not open the display board.');
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    if (!session?.expiresAt) return;
    const wait = Math.max(0, new Date(session.expiresAt).getTime() - Date.now()) + 500;
    const timer = setTimeout(() => void refreshSession(), wait);
    return () => clearTimeout(timer);
  }, [session, refreshSession]);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    if (!voiceOn || !canShow) return;
    const announce = () => speakText(buildRateAnnouncement(rowsRef.current));
    announce();
    const id = setInterval(announce, VOICE_INTERVAL_MS);
    return () => {
      clearInterval(id);
      stopSpeaking();
    };
  }, [voiceOn, canShow]);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement && !showBilling) onClose();
    };
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [onClose, showBilling]);

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

      <div className="relative flex-1 overflow-y-auto">
        {rows.map((row, idx) => (
          <div key={row.symbol} className={`${ROW_GRID} min-h-[80px] px-6 md:px-12 ${ROW_BG[idx % 2]}`}>
            <div className="flex items-center gap-4">
              <span className="text-[32px] leading-none">{row.flag}</span>
              <div>
                <p className="text-5xl font-extrabold">{row.symbol}</p>
                <p className="text-base text-neutral-400">{row.currencyCode}</p>
              </div>
            </div>
            <p className="text-right text-5xl font-extrabold tabular-nums">{formatPrice(row.buying, 2)}</p>
            <p className="text-right text-5xl font-extrabold tabular-nums text-brand">{formatPrice(row.selling, 2)}</p>
            <p className={`text-right text-2xl font-bold tabular-nums ${row.changePct >= 0 ? 'text-up' : 'text-down'}`}>
              {formatPercent(row.changePct)}
            </p>
          </div>
        ))}

        {session === null && !sessionError && (
          <p className="px-6 py-12 text-center text-sm text-neutral-400 md:px-12">Opening the display board...</p>
        )}

        {sessionError && (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <p role="alert" className="text-sm text-down">{sessionError}</p>
            <button
              type="button"
              onClick={() => void refreshSession()}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors duration-200 hover:border-brand hover:text-brand"
            >
              Try again
            </button>
          </div>
        )}

        {isDenied && <DisplayPaywall now={now} onBuy={() => setShowBilling(true)} />}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-800 px-6 py-3 md:px-12">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setVoiceOn((v) => !v)}
            disabled={!canShow}
            aria-pressed={voiceOn}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-semibold text-neutral-300 transition-colors duration-200 hover:border-brand hover:text-brand disabled:opacity-40"
          >
            {voiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            Voice {voiceOn ? 'on' : 'off'}
          </button>
          {session && canShow && describeAccess(session) && (
            <span className="text-xs text-neutral-500">{describeAccess(session)}</span>
          )}
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

      {showBilling && <BillingModal reason="display" onClose={() => setShowBilling(false)} />}
    </div>
  );
}

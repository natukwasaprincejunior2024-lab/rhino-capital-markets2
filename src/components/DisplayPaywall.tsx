import { Clock, Lock } from 'lucide-react';
import { BUREAU_TIME_ZONE } from '@/lib/bureau-info';

const DAY_MS = 24 * 60 * 60 * 1000;
const KAMPALA_OFFSET_MS = 3 * 60 * 60 * 1000;

function nextKampalaMidnight(now: number): number {
  const kampalaNow = now + KAMPALA_OFFSET_MS;
  return Math.floor(kampalaNow / DAY_MS + 1) * DAY_MS - KAMPALA_OFFSET_MS;
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

interface DisplayPaywallProps {
  now: Date;
  onBuy: () => void;
}

export default function DisplayPaywall({ now, onBuy }: DisplayPaywallProps) {
  const remaining = nextKampalaMidnight(now.getTime()) - now.getTime();
  const resetText = new Date(nextKampalaMidnight(now.getTime())).toLocaleTimeString('en-GB', {
    timeZone: BUREAU_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-brand/40 bg-[#141414] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 text-brand">
          <Lock size={26} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-extrabold text-white">Today's free display time is used</h3>
          <p className="text-sm leading-relaxed text-neutral-400">
            Your free 30 minutes reset at midnight (Kampala time). Buy display time to keep the board on screen now.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-ink p-5">
          <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
            <Clock size={14} /> Free time resets in
          </p>
          <p className="mt-2 text-4xl font-extrabold tabular-nums text-brand">{formatCountdown(remaining)}</p>
          <p className="mt-1 text-xs text-neutral-500">at {resetText} EAT</p>
        </div>
        <button
          type="button"
          onClick={onBuy}
          className="w-full rounded-lg bg-brand py-3 text-sm font-extrabold text-ink transition-all duration-200 hover:brightness-110"
        >
          Buy display time
        </button>
      </div>
    </div>
  );
}

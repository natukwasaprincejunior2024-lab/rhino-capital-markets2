import { Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function PlanStatus() {
  const { user, trialDaysLeft, isTrialActive, isPro, isElite } = useAuth();
  if (!user) return null;

  const showPill = isTrialActive || !isPro;

  return (
    <div className="flex items-center gap-2">
      {showPill && (
        <span
          className={`hidden items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold md:inline-flex ${
            isTrialActive ? 'border-brand/60 bg-brand/15 text-fg' : 'border-border bg-card text-muted'
          }`}
        >
          {isTrialActive && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
          )}
          {isTrialActive
            ? `Trial: ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left`
            : 'Free plan'}
        </span>
      )}

      {!isElite && (
        <a
          href="/pricing"
          className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-gold px-3.5 text-sm font-extrabold text-ink shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-md"
        >
          {isPro ? <Crown size={15} /> : <Sparkles size={15} />}
          Upgrade
        </a>
      )}
    </div>
  );
}

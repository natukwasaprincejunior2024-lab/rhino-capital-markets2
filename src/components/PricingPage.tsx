import { useState, type ReactNode } from 'react';
import { ArrowLeft, Check, Crown, Flame, Landmark, Loader2, Smartphone, Star } from 'lucide-react';
import Modal from '@/components/Modal';
import MomoPaymentForm, { type MomoOrder } from '@/components/MomoPaymentForm';
import PricingComparison from '@/components/PricingComparison';
import { useAuth } from '@/lib/auth-context';
import { startCheckout, type ProductKey } from '@/lib/billing-api';
import {
  DISPLAY_HOUR,
  FREE_FEATURES,
  MOMO_PRICES_UGX,
  PAID_PLANS,
  PRINT_PACKS,
  type PaidPlan,
  type PaidPlanId,
} from '@/lib/billing-catalog';
import { BUREAU_TIME_ZONE } from '@/lib/bureau-info';

const BADGE_ICON = { Popular: Flame, 'Best value': Star, Elite: Crown } as const;

export default function PricingPage() {
  const { user, billing, isTrialActive } = useAuth();
  const [selected, setSelected] = useState<PaidPlanId>('monthly');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [momoOrder, setMomoOrder] = useState<MomoOrder | null>(null);

  const orderWithMomo = (product: ProductKey, label: string) => {
    setMomoOrder({ product, quantity: 1, amountUgx: MOMO_PRICES_UGX[product], label });
  };

  const currentPlan = billing?.isPro ? billing.plan : 'free';
  const trialEnd = billing?.trialEndsAt && isTrialActive
    ? new Date(billing.trialEndsAt).toLocaleDateString('en-GB', { timeZone: BUREAU_TIME_ZONE, day: 'numeric', month: 'short' })
    : null;

  const buy = async (product: ProductKey, key: string) => {
    setBusyKey(key);
    setError(null);
    try {
      await startCheckout(product, 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout. Please try again.');
      setBusyKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-ink">
              <Landmark size={20} strokeWidth={2.5} />
            </div>
            <p className="text-sm font-extrabold tracking-wide">RHINO</p>
          </div>
          <a
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-semibold text-fg transition-colors duration-200 hover:border-brand hover:text-brand"
          >
            <ArrowLeft size={16} /> Back to dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-16 px-4 py-12 lg:px-6 lg:py-16">
        <section className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand">Pricing</p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">Plans for every exchange desk</h1>
          <p className="text-base leading-relaxed text-muted">
            Start free. Every new account gets 7 days of Pro, with no card required.
          </p>
          {trialEnd && (
            <p className="text-sm font-semibold text-gold">Your free Pro trial runs until {trialEnd}.</p>
          )}
        </section>

        <section aria-labelledby="plans-heading" className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <h2 id="plans-heading" className="sr-only">Subscription plans</h2>
            <div role="group" aria-label="Choose a plan to highlight" className="inline-flex flex-wrap justify-center gap-1 rounded-xl border border-border bg-card p-1">
              {PAID_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  aria-pressed={selected === plan.id}
                  onClick={() => setSelected(plan.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    selected === plan.id ? 'bg-brand text-ink' : 'text-muted hover:text-fg'
                  }`}
                >
                  {plan.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p role="alert" className="mx-auto max-w-xl rounded-lg border border-down/40 bg-down/10 p-3 text-center text-sm text-down">
              {error}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
            <article className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-extrabold">Free</h3>
              <p className="mt-3 text-4xl font-extrabold tabular-nums">$0</p>
              <p className="mt-1 text-sm text-muted">Forever</p>
              <ul className="mt-6 flex-1 space-y-3">
                {FREE_FEATURES.map((feature) => (
                  <FeatureItem key={feature} text={feature} />
                ))}
              </ul>
              <p className="mt-6 rounded-lg border border-border py-2.5 text-center text-sm font-semibold text-muted">
                {currentPlan === 'free' ? 'Your current plan' : 'Included with every account'}
              </p>
            </article>

            {PAID_PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                highlighted={selected === plan.id}
                isCurrent={currentPlan === plan.id}
                signedIn={Boolean(user)}
                busy={busyKey === `plan-${plan.id}`}
                disabled={busyKey !== null}
                onSelect={() => setSelected(plan.id)}
                onBuy={() => void buy(plan.id, `plan-${plan.id}`)}
                onPayMomo={() => orderWithMomo(plan.id, `${plan.label} plan`)}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="payg-heading" className="space-y-6">
          <div className="text-center">
            <h2 id="payg-heading" className="text-2xl font-extrabold tracking-tight">Pay only for what you use</h2>
            <p className="mt-2 text-sm text-muted">No subscription. Buy credits when you need them.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {PRINT_PACKS.map((pack) => (
              <PayAsYouGoCard
                key={pack.product}
                title={`${pack.prints} ${pack.prints === 1 ? 'print' : 'prints'}`}
                price={pack.price}
                detail={`About ${pack.ugx}${pack.saving ? ` · ${pack.saving}` : ''}`}
                busy={busyKey === pack.product}
                disabled={busyKey !== null}
                onBuy={() => void buy(pack.product, pack.product)}
                onPayMomo={() => orderWithMomo(pack.product, `${pack.prints} ${pack.prints === 1 ? 'print' : 'prints'}`)}
              />
            ))}
            <PayAsYouGoCard
              title="Display board hour"
              price={DISPLAY_HOUR.price}
              detail={`About ${DISPLAY_HOUR.ugx} per hour`}
              busy={busyKey === 'display_hour'}
              disabled={busyKey !== null}
              onBuy={() => void buy('display_hour', 'display_hour')}
              onPayMomo={() => orderWithMomo('display_hour', '1 hour of display time')}
            />
          </div>
          {!user && (
            <p className="text-center text-sm text-muted">
              <a href="/" className="font-semibold text-brand hover:underline">Sign in</a> to buy a plan or credits.
            </p>
          )}
        </section>

        <PricingComparison />

        <p className="text-center text-xs text-muted">
          Prices are in US dollars. Local amounts are approximate. Card payments are processed securely by Stripe. MTN MoMo payments are confirmed by our team.
        </p>
      </main>

      {momoOrder && (
        <Modal title="Pay with MTN MoMo" onClose={() => setMomoOrder(null)} widthClass="max-w-lg">
          <MomoPaymentForm order={momoOrder} onDone={() => setMomoOrder(null)} />
        </Modal>
      )}
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-muted">
      <Check size={16} className="mt-0.5 shrink-0 text-up" />
      <span>{text}</span>
    </li>
  );
}

interface PlanCardProps {
  plan: PaidPlan;
  highlighted: boolean;
  isCurrent: boolean;
  signedIn: boolean;
  busy: boolean;
  disabled: boolean;
  onSelect: () => void;
  onBuy: () => void;
  onPayMomo: () => void;
}

function PlanCard({ plan, highlighted, isCurrent, signedIn, busy, disabled, onSelect, onBuy, onPayMomo }: PlanCardProps) {
  const BadgeIcon = plan.badge ? BADGE_ICON[plan.badge] : null;
  const isMonthly = plan.id === 'monthly';

  let cta: ReactNode;
  if (isCurrent) {
    cta = <p className="rounded-lg border border-up/50 py-2.5 text-center text-sm font-semibold text-up">Your current plan</p>;
  } else if (!signedIn) {
    cta = (
      <a href="/" className="block rounded-lg border border-border py-2.5 text-center text-sm font-semibold text-fg transition-colors duration-200 hover:border-brand hover:text-brand">
        Sign in to subscribe
      </a>
    );
  } else {
    cta = (
      <div className="space-y-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onBuy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-extrabold text-ink transition-all duration-200 hover:brightness-110 disabled:opacity-60"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          Choose {plan.label}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onPayMomo}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-semibold text-fg transition-colors duration-200 hover:border-brand hover:text-brand disabled:opacity-60"
        >
          <Smartphone size={16} /> Pay with MoMo
        </button>
      </div>
    );
  }

  return (
    <article
      onClick={onSelect}
      className={`relative flex cursor-pointer flex-col rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        highlighted ? 'border-brand ring-2 ring-brand/40' : 'border-border'
      } ${isMonthly && highlighted ? 'border-gold ring-gold/40' : ''}`}
    >
      {plan.badge && BadgeIcon && (
        <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-extrabold text-ink">
          <BadgeIcon size={12} /> {plan.badge}
        </span>
      )}
      <h3 className="text-lg font-extrabold">{plan.label}</h3>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="text-4xl font-extrabold tabular-nums">{plan.price}</span>
        <span className="text-sm text-muted">{plan.period}</span>
      </p>
      <p className="mt-1 text-sm text-muted">{plan.note}</p>
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <FeatureItem key={feature} text={feature} />
        ))}
      </ul>
      <div className="mt-6" onClick={(e) => e.stopPropagation()}>
        {cta}
      </div>
    </article>
  );
}

interface PayAsYouGoCardProps {
  title: string;
  price: string;
  detail: string;
  busy: boolean;
  disabled: boolean;
  onBuy: () => void;
  onPayMomo: () => void;
}

function PayAsYouGoCard({ title, price, detail, busy, disabled, onBuy, onPayMomo }: PayAsYouGoCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-semibold text-muted">{title}</p>
      <p className="text-2xl font-extrabold tabular-nums">{price}</p>
      <p className="text-xs text-muted">{detail}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={onBuy}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-semibold text-fg transition-colors duration-200 hover:border-brand hover:text-brand disabled:opacity-60"
      >
        {busy && <Loader2 size={14} className="animate-spin" />}
        Buy
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onPayMomo}
        className="inline-flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-muted transition-colors duration-200 hover:text-brand disabled:opacity-60"
      >
        <Smartphone size={14} /> Pay with MoMo
      </button>
    </div>
  );
}

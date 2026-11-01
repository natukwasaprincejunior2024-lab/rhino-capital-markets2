import { useMemo } from 'react';
import CurrencyConverter from '@/components/CurrencyConverter';
import PriceChange from '@/components/PriceChange';
import {
  ASSET_CLASS_LABELS,
  changePercent,
  computeFearGreed,
  fearGreedColor,
  fearGreedLabel,
  formatPercent,
  formatPrice,
  type AssetClass,
  type Instrument,
} from '@/lib/market-data';

interface AnalyticsTabProps {
  instruments: Instrument[];
}

interface Mover {
  instrument: Instrument;
  change: number;
}

function rangePercent(i: Instrument): number {
  return i.price > 0 ? ((i.high - i.low) / i.price) * 100 : 0;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
}

export default function AnalyticsTab({ instruments }: AnalyticsTabProps) {
  const summary = useMemo(() => {
    const movers: Mover[] = instruments.map((instrument) => ({
      instrument,
      change: changePercent(instrument.price, instrument.prevPrice),
    }));
    const sorted = [...movers].sort((a, b) => b.change - a.change);
    const classes = Object.keys(ASSET_CLASS_LABELS) as AssetClass[];
    const byClass = classes
      .map((assetClass) => {
        const list = movers.filter((m) => m.instrument.assetClass === assetClass);
        return {
          assetClass,
          count: list.length,
          avgChange: average(list.map((m) => m.change)),
          up: list.filter((m) => m.change > 0).length,
          down: list.filter((m) => m.change < 0).length,
        };
      })
      .filter((row) => row.count > 0);

    return {
      advancers: movers.filter((m) => m.change > 0).length,
      decliners: movers.filter((m) => m.change < 0).length,
      avgRange: average(instruments.map(rangePercent)),
      gainers: sorted.filter((m) => m.change > 0).slice(0, 5),
      losers: sorted.filter((m) => m.change < 0).slice(-5).reverse(),
      volatile: [...instruments].sort((a, b) => rangePercent(b) - rangePercent(a)).slice(0, 5),
      byClass,
    };
  }, [instruments]);

  const fearGreed = computeFearGreed(instruments);
  const total = summary.advancers + summary.decliners;
  const breadth = total > 0 ? (summary.advancers / total) * 100 : 50;

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Market sentiment</p>
            <p className="mt-2 text-3xl font-extrabold tabular-nums" style={{ color: fearGreedColor(fearGreed) }}>
              {fearGreed}
            </p>
            <p className="mt-1 text-sm text-muted">{fearGreedLabel(fearGreed)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Advancers vs decliners</p>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-fg">
              {summary.advancers}
              <span className="text-muted"> / </span>
              {summary.decliners}
            </p>
            <div
              className="mt-3 flex h-2 overflow-hidden rounded-full bg-bg"
              role="img"
              aria-label={`${summary.advancers} advancing, ${summary.decliners} declining`}
            >
              <div className="h-full bg-up transition-all duration-500" style={{ width: `${breadth}%` }} />
              <div className="h-full flex-1 bg-down" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Average daily range</p>
            <p className="mt-2 text-3xl font-extrabold tabular-nums text-fg">{formatPercent(summary.avgRange)}</p>
            <p className="mt-1 text-sm text-muted">High to low across all markets</p>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-bold text-fg">Performance by asset class</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 font-semibold">Class</th>
                  <th className="py-2 text-right font-semibold">Instruments</th>
                  <th className="py-2 text-right font-semibold">Avg change</th>
                  <th className="py-2 text-right font-semibold">Up / down</th>
                </tr>
              </thead>
              <tbody>
                {summary.byClass.map((row) => (
                  <tr key={row.assetClass} className="border-b border-border/60 last:border-0">
                    <td className="py-3 font-semibold text-fg">{ASSET_CLASS_LABELS[row.assetClass]}</td>
                    <td className="py-3 text-right tabular-nums text-muted">{row.count}</td>
                    <td className="py-3 text-right">
                      <span className={`font-semibold tabular-nums ${row.avgChange >= 0 ? 'text-up' : 'text-down'}`}>
                        {formatPercent(row.avgChange)}
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums text-muted">
                      {row.up} / {row.down}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <MoverList title="Top gainers" movers={summary.gainers} />
          <MoverList title="Top losers" movers={summary.losers} />
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-bold text-fg">Most volatile today</h2>
          <ul className="mt-4 divide-y divide-border">
            {summary.volatile.map((i) => (
              <li key={i.symbol} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-fg">
                    {i.flag} {i.symbol}
                  </p>
                  <p className="truncate text-xs text-muted">{i.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-fg">{formatPercent(rangePercent(i))}</p>
                  <p className="text-xs text-muted">range</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-border bg-card p-5 xl:sticky xl:top-40">
        <h2 className="text-base font-bold text-fg">Currency converter</h2>
        <p className="mt-1 text-sm text-muted">Convert between US dollars and local currencies at live rates.</p>
        <div className="mt-5">
          <CurrencyConverter instruments={instruments} />
        </div>
      </aside>
    </div>
  );
}

function MoverList({ title, movers }: { title: string; movers: Mover[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-bold text-fg">{title}</h2>
      {movers.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nothing to show right now.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {movers.map(({ instrument: i }) => (
            <li key={i.symbol} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-fg">
                  {i.flag} {i.symbol}
                </p>
                <p className="text-xs tabular-nums text-muted">{formatPrice(i.price, i.decimals)}</p>
              </div>
              <PriceChange price={i.price} prevPrice={i.prevPrice} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

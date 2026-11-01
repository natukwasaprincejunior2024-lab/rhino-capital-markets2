import { usePositions } from '@/lib/use-positions';
import type { usePriceAlerts } from '@/lib/use-price-alerts';
import AlertsPanel from '@/components/AlertsPanel';
import PositionsPanel from '@/components/PositionsPanel';
import type { Instrument } from '@/lib/market-data';

interface PortfolioTabProps {
  instruments: Instrument[];
  alerts: ReturnType<typeof usePriceAlerts>;
}

export default function PortfolioTab({ instruments, alerts }: PortfolioTabProps) {
  const portfolio = usePositions();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">Portfolio</h1>
        <p className="mt-1 text-sm text-muted">Track your open positions and get alerted when prices reach your targets.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PositionsPanel
          instruments={instruments}
          positions={portfolio.positions}
          loading={portfolio.loading}
          error={portfolio.error}
          onAdd={portfolio.add}
          onClose={portfolio.close}
        />
        <AlertsPanel
          instruments={instruments}
          alerts={alerts.alerts}
          loading={alerts.loading}
          error={alerts.error}
          onAdd={alerts.add}
          onRemove={alerts.remove}
        />
      </div>
    </section>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, FileText, Link2, Loader2, Tv } from 'lucide-react';
import BureauProfileModal from '@/components/BureauProfileModal';
import DailyReportModal from '@/components/DailyReportModal';
import DisplayBoard from '@/components/DisplayBoard';
import DisplayLinksModal from '@/components/DisplayLinksModal';
import RatesEditor, { type RateMap } from '@/components/RatesEditor';
import TransactionCalculator from '@/components/TransactionCalculator';
import TransactionHistory from '@/components/TransactionHistory';
import {
  addTransaction,
  EMPTY_BUREAU_PROFILE,
  fetchBureauProfile,
  fetchRates,
  fetchTransactions,
  saveBureauProfile,
  saveRates,
  type BureauProfile,
  type NewTransaction,
  type RateRow,
  type TransactionRow,
} from '@/lib/bureau-api';
import { generateDailyReport, getInstrumentsByClass, type Instrument } from '@/lib/market-data';

const BUREAU_PAIRS: Instrument[] = getInstrumentsByClass('africa');

interface BureauTabProps {
  instruments: Instrument[];
}

function mergeRates(savedRows: RateRow[]): RateMap {
  const map: RateMap = Object.fromEntries(
    BUREAU_PAIRS.map((i) => [i.symbol, { symbol: i.symbol, buying: i.buying, selling: i.selling }])
  );
  for (const row of savedRows) {
    if (row.symbol in map) map[row.symbol] = row;
  }
  return map;
}

export default function BureauTab({ instruments }: BureauTabProps) {
  const [rates, setRates] = useState<RateMap | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [profile, setProfile] = useState<BureauProfile>(EMPTY_BUREAU_PROFILE);
  const [profileOpen, setProfileOpen] = useState(false);
  const [linksOpen, setLinksOpen] = useState(false);

  const report = useMemo(() => {
    if (!rates) return null;
    const withSavedRates = instruments
      .filter((i) => i.assetClass === 'africa' && rates[i.symbol])
      .map((i) => ({ ...i, buying: rates[i.symbol].buying, selling: rates[i.symbol].selling }));
    return generateDailyReport(withSavedRates);
  }, [instruments, rates]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [rateRows, txRows, savedProfile] = await Promise.all([fetchRates(), fetchTransactions(), fetchBureauProfile()]);
      setRates(mergeRates(rateRows));
      setTransactions(txRows);
      setProfile(savedProfile);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load the bureau data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSaveRates = async (rows: RateRow[]) => {
    await saveRates(rows);
    setRates(mergeRates(rows));
  };

  const handleSaveProfile = async (next: BureauProfile) => {
    await saveBureauProfile(next);
    setProfile(next);
  };

  const handleRecord = async (input: NewTransaction) => {
    const tx = await addTransaction(input);
    setTransactions((prev) => [tx, ...prev]);
    return tx;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-brand" />
      </div>
    );
  }

  if (loadError || !rates) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-down/40 bg-down/10 px-6 py-12 text-center">
        <AlertTriangle size={28} className="text-down" />
        <div>
          <p className="font-semibold text-fg">The bureau data could not be loaded.</p>
          <p className="mt-1 text-sm text-muted">{loadError ?? 'Please try again.'}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="h-9 rounded-lg bg-brand px-4 text-sm font-extrabold text-ink transition-all duration-200 hover:brightness-110"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">Forex Bureau</h1>
          <p className="mt-1 text-sm text-muted">Manage your African currency rates and record exchanges.</p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-fg transition-all duration-200 hover:border-brand hover:text-brand"
          >
            <Building2 size={16} /> Bureau details
          </button>
          <button
            type="button"
            onClick={() => setDisplayOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-fg transition-all duration-200 hover:border-brand hover:text-brand"
          >
            <Tv size={16} /> Display board
          </button>
          <button
            type="button"
            onClick={() => setLinksOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-fg transition-all duration-200 hover:border-brand hover:text-brand"
          >
            <Link2 size={16} /> Public link
          </button>
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand/60 bg-brand/10 px-4 text-sm font-semibold text-brand transition-all duration-200 hover:bg-brand/20"
          >
            <FileText size={16} /> Daily report
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <RatesEditor instruments={BUREAU_PAIRS} rates={rates} onSave={handleSaveRates} />
        <TransactionCalculator instruments={BUREAU_PAIRS} rates={rates} profile={profile} onRecord={handleRecord} />
      </div>

      <TransactionHistory transactions={transactions} />

      {reportOpen && report && <DailyReportModal report={report} profile={profile} onClose={() => setReportOpen(false)} />}
      {displayOpen && report && (
        <DisplayBoard rows={report.rows} profile={profile} onClose={() => setDisplayOpen(false)} />
      )}
      {linksOpen && <DisplayLinksModal onClose={() => setLinksOpen(false)} />}
      {profileOpen && (
        <BureauProfileModal profile={profile} onSave={handleSaveProfile} onClose={() => setProfileOpen(false)} />
      )}
    </section>
  );
}

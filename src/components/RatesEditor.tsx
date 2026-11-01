import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { formatPrice, type Instrument } from '@/lib/market-data';
import type { RateRow } from '@/lib/bureau-api';

export type RateMap = Record<string, RateRow>;

type Draft = Record<string, { buying: string; selling: string }>;

interface RatesEditorProps {
  instruments: Instrument[];
  rates: RateMap;
  onSave: (rows: RateRow[]) => Promise<void>;
}

function toDraft(instruments: Instrument[], rates: RateMap): Draft {
  return Object.fromEntries(
    instruments.map((i) => [i.symbol, { buying: String(rates[i.symbol].buying), selling: String(rates[i.symbol].selling) }])
  );
}

function parseDraft(instruments: Instrument[], draft: Draft): { rows?: RateRow[]; error?: string } {
  const rows: RateRow[] = [];
  for (const i of instruments) {
    const buying = Number(draft[i.symbol].buying);
    const selling = Number(draft[i.symbol].selling);
    if (!(buying > 0) || !(selling > 0)) return { error: `${i.symbol}: rates must be greater than zero.` };
    if (selling < buying) return { error: `${i.symbol}: selling rate must be higher than the buying rate.` };
    rows.push({ symbol: i.symbol, buying, selling });
  }
  return { rows };
}

export default function RatesEditor({ instruments, rates, onSave }: RatesEditorProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(instruments, rates));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(toDraft(instruments, rates));
    setSaved(false);
  }, [instruments, rates]);

  const savedDraft = toDraft(instruments, rates);
  const dirty = instruments.some(
    (i) => draft[i.symbol].buying !== savedDraft[i.symbol].buying || draft[i.symbol].selling !== savedDraft[i.symbol].selling
  );

  const update = (symbol: string, field: 'buying' | 'selling', value: string) => {
    setSaved(false);
    setDraft((prev) => ({ ...prev, [symbol]: { ...prev[symbol], [field]: value } }));
  };

  const handleSave = async () => {
    setError(null);
    const parsed = parseDraft(instruments, draft);
    if (!parsed.rows) {
      setError(parsed.error ?? 'Please check the rates.');
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed.rows);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save rates. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-fg">Bureau rates</h2>
          <p className="text-xs text-muted">Set the rates your customers see. Changes apply once saved.</p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs font-semibold text-gold">Unsaved changes</span>}
          {saved && !dirty && (
            <span className="flex items-center gap-1 text-xs font-semibold text-up">
              <Check size={14} /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-extrabold text-ink transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving' : 'Save rates'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mx-5 mt-4 rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted">
              <th className="px-5 py-3 text-left font-semibold">Currency</th>
              <th className="px-3 py-3 text-right font-semibold">Buying</th>
              <th className="px-3 py-3 text-right font-semibold">Selling</th>
              <th className="px-5 py-3 text-right font-semibold">Spread</th>
            </tr>
          </thead>
          <tbody>
            {instruments.map((i) => {
              const buying = Number(draft[i.symbol].buying);
              const selling = Number(draft[i.symbol].selling);
              const spread = selling - buying;
              return (
                <tr key={i.symbol} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{i.flag}</span>
                      <div>
                        <p className="font-semibold text-fg">{i.symbol}</p>
                        <p className="text-xs text-muted">{i.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <RateInput
                      label={`${i.symbol} buying rate`}
                      value={draft[i.symbol].buying}
                      onChange={(v) => update(i.symbol, 'buying', v)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <RateInput
                      label={`${i.symbol} selling rate`}
                      value={draft[i.symbol].selling}
                      onChange={(v) => update(i.symbol, 'selling', v)}
                    />
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-muted">
                    {Number.isFinite(spread) ? formatPrice(spread, i.decimals) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step="any"
      min="0"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full min-w-[120px] rounded-lg border border-border bg-bg px-3 text-right text-sm tabular-nums text-fg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
    />
  );
}

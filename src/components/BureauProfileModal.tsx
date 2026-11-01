import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import type { BureauProfile } from '@/lib/bureau-api';

interface BureauProfileModalProps {
  profile: BureauProfile;
  onSave: (profile: BureauProfile) => Promise<void>;
  onClose: () => void;
}

const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';

export default function BureauProfileModal({ profile, onSave, onClose }: BureauProfileModalProps) {
  const [draft, setDraft] = useState<BureauProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof BureauProfile) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!draft.name.trim()) {
      setError('Please enter your bureau name.');
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: draft.name.trim(), address: draft.address.trim(), phone: draft.phone.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the bureau details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Bureau details" onClose={onClose} widthClass="max-w-lg">
      <p className="mb-5 text-xs text-muted">These details appear on receipts, daily rate reports and the display board.</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Bureau name</span>
          <input type="text" value={draft.name} onChange={update('name')} maxLength={120} className={INPUT_CLASS} />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Address</span>
          <textarea
            value={draft.address}
            onChange={update('address')}
            maxLength={250}
            rows={2}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Phone</span>
          <input type="tel" value={draft.phone} onChange={update('phone')} maxLength={40} className={`${INPUT_CLASS} tabular-nums`} />
        </label>

        {error && (
          <p role="alert" className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-extrabold text-ink transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Saving' : 'Save details'}
        </button>
      </form>
    </Modal>
  );
}

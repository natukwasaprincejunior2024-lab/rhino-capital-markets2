import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Loader2, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import {
  buildBoardUrl,
  createDisplayLink,
  fetchDisplayLinks,
  revokeDisplayLink,
  type DisplayLink,
} from '@/lib/display-links-api';

interface DisplayLinksModalProps {
  onClose: () => void;
}

export default function DisplayLinksModal({ onClose }: DisplayLinksModalProps) {
  const [links, setLinks] = useState<DisplayLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [confirmToken, setConfirmToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLinks(await fetchDisplayLinks());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your links.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const link = await createDisplayLink();
      setLinks((prev) => [link, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a link.');
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(buildBoardUrl(token));
      setCopiedToken(token);
      setTimeout(() => setCopiedToken((current) => (current === token ? null : current)), 2000);
    } catch {
      setError('Could not copy automatically. Select the link and copy it manually.');
    }
  };

  const handleRevoke = async (token: string) => {
    if (confirmToken !== token) {
      setConfirmToken(token);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await revokeDisplayLink(token);
      setLinks((prev) => prev.filter((link) => link.token !== token));
      setConfirmToken(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke the link.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Public display link" onClose={onClose} widthClass="max-w-2xl">
      <div className="space-y-5">
        <p className="text-sm text-muted">
          Anyone with a link can view your current rates and bureau details. Transactions are never shared. Revoke a link to stop it working.
        </p>

        {error && (
          <p role="alert" className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 size={22} className="animate-spin text-brand" />
          </div>
        ) : links.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            No active display links yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {links.map((link) => {
              const url = buildBoardUrl(link.token);
              const copied = copiedToken === link.token;
              const confirming = confirmToken === link.token;
              return (
                <li key={link.token} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center">
                  <input
                    readOnly
                    value={url}
                    onFocus={(e) => e.currentTarget.select()}
                    aria-label="Display link"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 text-xs text-fg outline-none focus:border-brand"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopy(link.token)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-fg transition-all duration-200 hover:border-brand hover:text-brand"
                    >
                      {copied ? <Check size={14} className="text-up" /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRevoke(link.token)}
                      disabled={busy}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-down/50 px-3 text-xs font-semibold text-down transition-all duration-200 hover:bg-down/10 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {confirming ? 'Confirm revoke' : 'Revoke'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={busy || loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-extrabold text-ink transition-all duration-200 hover:brightness-110 disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Create new link
          </button>
        </div>
      </div>
    </Modal>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import type { NotificationCenter } from '@/lib/use-notifications';

interface NotificationsMenuProps {
  center: NotificationCenter;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function NotificationsMenu({ center }: NotificationsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { items, unreadCount, loading, error, markAllRead, reload } = center;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const countLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted transition-all duration-200 hover:border-brand hover:text-fg"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-down px-1 text-[10px] font-bold leading-none text-white">
            {countLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-bold text-fg">Notifications</p>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition-opacity duration-200 hover:opacity-80 disabled:text-muted disabled:opacity-60"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex h-24 items-center justify-center">
                <Loader2 size={18} className="animate-spin text-brand" />
              </div>
            ) : error ? (
              <div className="space-y-3 p-4">
                <p className="text-sm text-down">{error}</p>
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="h-8 rounded-md border border-border px-3 text-xs font-semibold text-fg hover:border-brand"
                >
                  Try again
                </button>
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted">You have no notifications yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => (
                  <li key={n.id} className="flex gap-3 px-4 py-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? 'bg-transparent' : 'bg-brand'}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className={`text-sm ${n.readAt ? 'font-medium text-muted' : 'font-semibold text-fg'}`}>{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-muted">{n.body}</p>}
                      <p className="mt-1 text-[11px] tabular-nums text-muted">{formatWhen(n.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

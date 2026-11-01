import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}

export default function Modal({ title, onClose, children, widthClass = 'max-w-3xl' }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"
    >
      <div className={`w-full ${widthClass} rounded-2xl border border-border bg-card shadow-2xl`}>
        <div className="no-print flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-extrabold text-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition-colors duration-200 hover:bg-border/40 hover:text-fg"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

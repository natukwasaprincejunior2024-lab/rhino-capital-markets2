import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/lib/theme-context';

const OPTIONS: { value: ThemeMode; label: string; icon: LucideIcon }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function ThemeChanger() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="group" aria-label="Theme" className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            title={`${label} theme`}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-all duration-200 sm:w-auto sm:gap-1.5 sm:px-2.5 ${
              active ? 'bg-brand text-ink shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            <Icon size={14} />
            <span className="hidden text-xs font-semibold sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

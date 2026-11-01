import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
}

const STORAGE_KEY = 'rhino-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): ThemeMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [systemDark, setSystemDark] = useState<boolean>(() => window.matchMedia(DARK_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = useCallback((next: ThemeMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

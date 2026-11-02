import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchBillingStatus, type BillingStatus } from '@/lib/billing-api';

const TRIAL_DAYS = 7;
const DAY_MS = 86400000;

export interface AuthResult {
  error?: string;
  needsConfirmation?: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  trialEndsAt: Date | null;
  trialDaysLeft: number;
  isTrialActive: boolean;
  billing: BillingStatus | null;
  isPro: boolean;
  isElite: boolean;
  refreshBilling: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (lower.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (lower.includes('password should be at least')) return 'Password must be at least 6 characters.';
  if (lower.includes('fetch') || lower.includes('network')) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingStatus | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      (async () => {
        if (active) setSession(next);
      })();
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;
  const createdAt = user?.created_at;
  const trialEndsAt = useMemo(
    () => (createdAt ? new Date(new Date(createdAt).getTime() + TRIAL_DAYS * DAY_MS) : null),
    [createdAt]
  );
  const trialDaysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / DAY_MS)) : 0;
  const isTrialActive = trialDaysLeft > 0;
  const userId = user?.id ?? null;

  const refreshBilling = useCallback(async () => {
    try {
      setBilling(await fetchBillingStatus());
    } catch {
      setBilling(null);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setBilling(null);
      return;
    }
    void refreshBilling();
  }, [userId, refreshBilling]);

  useEffect(() => {
    if (!userId || new URLSearchParams(window.location.search).get('billing') !== 'success') return;
    window.history.replaceState(null, '', window.location.pathname);
    const retry = setTimeout(() => void refreshBilling(), 3000);
    return () => clearTimeout(retry);
  }, [userId, refreshBilling]);

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: friendlyError(error.message) };
    if (!data.session) return { needsConfirmation: true };
    return {};
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: friendlyError(error.message) } : {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      trialEndsAt,
      trialDaysLeft,
      isTrialActive,
      billing,
      isPro: billing?.isPro ?? false,
      isElite: billing?.isElite ?? false,
      refreshBilling,
      signUp,
      signIn,
      signOut,
    }),
    [user, loading, trialEndsAt, trialDaysLeft, isTrialActive, billing, refreshBilling, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

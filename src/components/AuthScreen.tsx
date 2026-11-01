import { useState, type FormEvent } from 'react';
import { Landmark, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type Mode = 'login' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (isSignup && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    const result = isSignup ? await signUp(name.trim(), email.trim(), password) : await signIn(email.trim(), password);
    setSubmitting(false);
    if (result.error) setError(result.error);
    if (result.needsConfirmation) {
      setNotice('Account created. Check your email to finish setting up your account, then log in.');
      switchMode('login');
    }
  };

  const handleDemo = async () => {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    const id = crypto.randomUUID();
    const result = await signUp('Demo User', `demo-${id.slice(0, 8)}@example.com`, id);
    setSubmitting(false);
    if (result.error) setError(result.error);
    if (result.needsConfirmation) {
      setNotice('Demo account created, but the server requires email confirmation before you can enter. Ask to have it turned off.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-ink">
            <Landmark size={26} strokeWidth={2.5} />
          </div>
          <p className="text-lg font-extrabold tracking-wide text-fg">RHINO CAPITAL MARKETS</p>
          <p className="mt-1 text-xs font-semibold tracking-[0.2em] text-muted">INSTITUTIONAL TRADING PLATFORM</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-lg border border-border bg-bg p-1">
            {(['signup', 'login'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                aria-pressed={mode === m}
                className={`rounded-md py-2 text-sm font-semibold transition-all duration-200 ${
                  mode === m ? 'bg-brand text-ink shadow-sm' : 'text-muted hover:text-fg'
                }`}
              >
                {m === 'signup' ? 'Create account' : 'Log in'}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-extrabold text-fg">{isSignup ? 'Start your 7-day free trial' : 'Welcome back'}</h1>
            <p className="mt-1 text-sm text-muted">
              {isSignup ? 'Full access to live markets and bureau tools. No card required.' : 'Log in to continue to your dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {isSignup && (
              <Field label="Full name" value={name} onChange={setName} autoComplete="name" />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              hint={isSignup ? 'At least 6 characters' : undefined}
            />

            {error && (
              <p role="alert" className="rounded-lg border border-down/40 bg-down/10 px-3 py-2 text-sm text-down">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="rounded-lg border border-up/40 bg-up/10 px-3 py-2 text-sm text-up">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-extrabold text-ink transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Please wait' : isSignup ? 'Create account' : 'Log in'}
            </button>
          </form>

          {isSignup && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs font-semibold text-muted">
                <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
              </div>
              <button
                type="button"
                onClick={() => void handleDemo()}
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand/60 bg-brand/10 text-sm font-semibold text-brand transition-all duration-200 hover:bg-brand/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Try the demo instantly
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  hint?: string;
}

function Field({ label, value, onChange, type = 'text', autoComplete, hint }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="h-11 w-full rounded-lg border border-border bg-bg px-3.5 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

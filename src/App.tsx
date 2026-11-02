import { Loader2 } from 'lucide-react';
import AuthScreen from '@/components/AuthScreen';
import Dashboard from '@/components/Dashboard';
import PricingPage from '@/components/PricingPage';
import PublicDisplayPage from '@/components/PublicDisplayPage';
import { getBoardTokenFromPath } from '@/lib/display-links-api';
import { useAuth } from '@/lib/auth-context';

function App() {
  const { user, loading } = useAuth();

  const boardToken = getBoardTokenFromPath(window.location.pathname);
  if (boardToken) return <PublicDisplayPage token={boardToken} />;

  if (window.location.pathname === '/pricing') return <PricingPage />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Loader2 size={28} className="animate-spin text-brand" />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
}

export default App;

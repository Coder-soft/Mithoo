import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { PenTool } from 'lucide-react';

const Login = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">Loading...</h2>
                <p className="text-muted-foreground">Please wait while we check your session.</p>
            </div>
        </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
            <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <PenTool className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-bold text-foreground">Mithoo</h1>
            </div>
            <h2 className="text-center text-2xl font-semibold text-foreground">
                Sign in to your workspace
            </h2>
            <p className="text-muted-foreground mt-2">
                Write amazing articles with your AI companion.
            </p>
        </div>
        <div className="bg-card p-8 rounded-lg shadow-subtle border border-border">
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google']}
              onlyThirdPartyProviders
              theme="light"
            />
        </div>
      </div>
    </div>
  );
};

export default Login;
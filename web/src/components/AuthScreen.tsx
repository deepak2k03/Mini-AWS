import { useState } from 'react';
import { Cloud, Lock, Mail } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { api } from '../api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const queryClient = useQueryClient();

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      onAuthenticated();
    }
  });

  const register = useMutation({
    mutationFn: api.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      onAuthenticated();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      login.mutate({ email, password });
    } else {
      register.mutate({ email, password });
    }
  };

  const isPending = login.isPending || register.isPending;
  const error = login.error || register.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-console-bg p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.05),transparent_70%)]"></div>
      
      <div className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-console-brandSubtle text-console-brand shadow-lg">
            <Cloud className="h-7 w-7" />
          </div>
          <h1 className="mt-6 text-[24px] font-bold tracking-tight text-console-text">Mini-AWS Console</h1>
          <p className="mt-2 text-[14px] text-console-secondary">Manage your isolated cloud infrastructure</p>
        </div>

        <Card className="border-console-border bg-console-card/90 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-[18px]">Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded border border-console-error/20 bg-console-error/10 p-3 text-[13px] text-console-error text-center animate-in fade-in zoom-in duration-300">
                  {error.message}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-medium text-console-text" htmlFor="email">Email</label>
                  <div className="relative mt-1.5 group">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-console-muted group-focus-within:text-console-brand transition-colors" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="developer@example.com"
                      className="w-full rounded border border-console-border bg-console-bg py-2 pl-9 pr-3 text-[13px] text-console-text placeholder:text-console-muted focus:border-console-brand focus:outline-none focus:ring-1 focus:ring-console-brand transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-console-text" htmlFor="password">Password</label>
                  <div className="relative mt-1.5 group">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-console-muted group-focus-within:text-console-brand transition-colors" />
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded border border-console-border bg-console-bg py-2 pl-9 pr-3 text-[13px] text-console-text placeholder:text-console-muted focus:border-console-brand focus:outline-none focus:ring-1 focus:ring-console-brand transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-6">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full h-10 shadow-lg shadow-console-brand/20 transition-all hover:shadow-console-brand/30"
                  disabled={isPending}
                >
                  {isPending ? 'Please wait...' : (isLogin ? 'Sign in' : 'Create Account')}
                </Button>

                <div className="text-center text-[13px] text-console-secondary">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    type="button" 
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-medium text-console-brand hover:text-console-hover hover:underline transition-all"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

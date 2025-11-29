'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <Logo className="mb-8 text-gray-900" />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">
              Sign in to access your deal pipeline
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-error-soft border border-error p-4 text-sm text-error">
                {error}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="font-medium text-brand-primary hover:text-brand-primary-hover">
                Sign up for free
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex bg-gradient-to-br from-brand-primary to-brand-primary-deep p-12">
        <div className="flex flex-col justify-center text-white max-w-lg">
          <h2 className="text-4xl font-bold mb-4">
            Find your next great investment
          </h2>
          <p className="text-xl text-white/90 mb-8">
            AI-powered deal analysis for real estate investors
          </p>

          <div className="space-y-4">
            <Feature text="Automated underwriting & analysis" />
            <Feature text="Smart deal matching with buy boxes" />
            <Feature text="Portfolio analytics & tracking" />
            <Feature text="Real-time market insights" />
          </div>

          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <p className="text-sm text-white/80 mb-2">Trusted by investors managing</p>
            <p className="text-3xl font-bold">$38M+</p>
            <p className="text-sm text-white/80 mt-1">in deal pipeline</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-6 h-6 bg-brand-ai rounded-full flex items-center justify-center">
        <CheckCircle className="w-4 h-4 text-white" />
      </div>
      <span className="text-white/90">{text}</span>
    </div>
  );
}

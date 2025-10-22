'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

/**
 * Sign-up page that:
 * 1) Creates the account via /api/register
 * 2) Automatically signs the user in with Credentials
 * 3) Redirects to /dashboard on success
 */
export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    try {
      // 1) Create account
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Unable to create account.');
        setLoading(false);
        return;
      }

      // 2) Immediately sign in with the same creds (Credentials provider)
      const si = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (si?.error) {
        setError('Account created, but auto sign-in failed. Please log in.');
        setLoading(false);
        router.replace('/sign-in?from=signup');
        return;
      }

      // 3) Go to dashboard
      router.replace('/dashboard');
    } catch (err) {
      setError('Unexpected error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border px-3 py-2"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border px-3 py-2"
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black text-white py-2"
        >
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </form>
    </main>
  );
}

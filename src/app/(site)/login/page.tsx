'use client';

import { useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { useRedirectIfAuthed } from '@/hooks/useRedirectIfAuthed';
import { getRoleHomePath } from '@/lib/getRoleHomePath';

export default function LoginPage() {
  useRedirectIfAuthed();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await signIn('credentials', { redirect: false, email, password });
    if (result?.error) {
      setLoading(false);
      toast.error('Invalid email or password');
      return;
    }
    // signIn(..., { redirect: false }) only returns { error, ok, status, url } — no user
    // data — so the freshly-issued session (which does carry role, via the jwt/session
    // callbacks in src/lib/auth.ts) has to be fetched separately to know where to send
    // this role.
    const session = await getSession();
    setLoading(false);
    router.push(getRoleHomePath(session?.user?.role));
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Log in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          Log in
        </Button>
      </form>
      <Button
        variant="outline"
        className="w-full mt-3"
        onClick={() => signIn('google', { callbackUrl: '/login' })}
      >
        Continue with Google
      </Button>
      <p className="text-sm text-gray-500 mt-6">
        No account?{' '}
        <Link href="/register" className="text-gray-900 underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

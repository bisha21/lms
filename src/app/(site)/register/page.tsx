'use client';

import { useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { API } from '@/http/http';
import { Button } from '@/components/ui/button';
import { useRedirectIfAuthed } from '@/hooks/useRedirectIfAuthed';
import { getRoleHomePath } from '@/lib/getRoleHomePath';

export default function RegisterPage() {
  useRedirectIfAuthed();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/register', { username, email, password });
      const result = await signIn('credentials', { redirect: false, email, password });
      if (result?.error) {
        toast.error('Account created — please log in');
        router.push('/login');
        return;
      }
      const session = await getSession();
      router.push(getRoleHomePath(session?.user?.role));
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create account';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create an account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
          />
        </div>
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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded-md"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          Sign up
        </Button>
      </form>
      <p className="text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-gray-900 underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

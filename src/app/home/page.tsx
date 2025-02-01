'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function Home() {
  const { data: session } = useSession();
  if (session) {
    return (
      <>
        Welcome  {session.user?.name} to our Lms<br />
        <p>your email: {session.user?.email}</p>
        <Image src={session.user?.image || '/vercel.svg'} alt="Vercel Logo" width={100} height={24} />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
}

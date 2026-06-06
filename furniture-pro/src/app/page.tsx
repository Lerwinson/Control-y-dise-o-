'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  useEffect(() => { router.replace(user ? '/dashboard' : '/login'); }, [user, router]);
  return <div className="h-screen flex items-center justify-center"><div className="loader" /></div>;
}

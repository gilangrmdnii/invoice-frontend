'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, hydrated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace('/login');
    }
  }, [token, hydrated, router]);

  if (!hydrated) return <LoadingSpinner />;
  if (!token) return <LoadingSpinner />;

  return <>{children}</>;
}

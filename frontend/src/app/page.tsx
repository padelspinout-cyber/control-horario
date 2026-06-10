'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    if (!accessToken) {
      router.replace('/login');
    } else if (role === 'ADMIN') {
      router.replace('/admin');
    } else {
      router.replace('/clock');
    }
  }, [router]);

  return null;
}

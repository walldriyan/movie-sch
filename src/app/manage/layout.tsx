'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && user && ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
      router.push('/');
    }
  }, [status, user, router]);


  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
          <Skeleton className="h-16 w-16 rounded-full" />
      </div>
    )
  }

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    return null;
  }

  return (
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 mt-16">
        {children}
      </main>
  );
}

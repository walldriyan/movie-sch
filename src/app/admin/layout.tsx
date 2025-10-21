'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ManageLayout from '@/components/manage/manage-layout';
import { ROLES } from '@/lib/permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';


export default function AdminLayout({
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
    } else if (status === 'authenticated' && user && user.role !== ROLES.SUPER_ADMIN) {
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

  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    return null;
  }

  return <ManageLayout>{children}</ManageLayout>;
}

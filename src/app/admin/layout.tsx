'use client';

import { useSession } from 'next-auth/react';
import { notFound } from 'next/navigation';
import Loading from '@/app/loading';
import ManageLayout from '@/components/manage/manage-layout';
import { ROLES } from '@/lib/permissions';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'unauthenticated' || !user || user.role !== ROLES.SUPER_ADMIN) {
    notFound();
  }

  return <ManageLayout user={user}>{children}</ManageLayout>;
}
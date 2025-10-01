'use server';

import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import Loading from '@/app/loading';
import ManageLayout from '@/components/manage/manage-layout';
import { ROLES } from '@/lib/permissions';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    notFound();
  }

  return <ManageLayout user={user}>{children}</ManageLayout>;
}


'use server';

import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import ManageLayout from '@/components/manage/manage-layout';
import { ROLES } from '@/lib/permissions';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    // Instead of notFound(), redirect to a more appropriate page like the homepage
    // or a custom "access-denied" page.
    redirect('/');
  }

  return <ManageLayout user={user}>{children}</ManageLayout>;
}

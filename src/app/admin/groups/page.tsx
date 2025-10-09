
'use server';

import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import { getGroups, getUsers } from '@/lib/actions';
import GroupsClient from '@/components/admin/groups-client';
import type { GroupWithCount } from '@/lib/types';
import type { User } from '@prisma/client';

export default async function ManageGroupsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    notFound();
  }

  const initialGroups = (await getGroups()) as GroupWithCount[];
  const allUsers = (await getUsers()) as User[];

  return (
    <div className="space-y-4">
      <GroupsClient initialGroups={initialGroups} allUsers={allUsers} />
    </div>
  );
}

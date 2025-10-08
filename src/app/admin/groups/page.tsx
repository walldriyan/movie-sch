
'use server';

import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import { getGroups } from '@/lib/actions/groupActions';
import { getUsers } from '@/lib/actions/userActions';
import GroupsClient from '@/components/admin/groups-client';

export default async function ManageGroupsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    notFound();
  }

  const initialGroups = await getGroups();
  const allUsers = await getUsers();

  return (
    <div className="space-y-4">
      <GroupsClient initialGroups={initialGroups} allUsers={allUsers} />
    </div>
  );
}

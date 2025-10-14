
import { notFound } from 'next/navigation';
import { getGroupForProfile } from '@/lib/actions';
import GroupProfileClient from './client';
import type { GroupForProfile } from '@/lib/types';
import { auth } from '@/auth';

export default async function GroupProfilePage({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }
  
  const session = await auth();
  console.log("Server [/groups/[id]/page.tsx] Session from auth() on server:", JSON.stringify(session, null, 2));

  const groupData = await getGroupForProfile(params.id);

  if (!groupData) {
    notFound();
  }
  
  return <GroupProfileClient group={groupData as GroupForProfile} session={session} />;
}

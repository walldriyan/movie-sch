
import { notFound } from 'next/navigation';
import { getGroupForProfile } from '@/lib/actions';
import GroupProfileClient from './client';
import type { GroupForProfile } from '@/lib/types';

export default async function GroupProfilePage({ params }: { params: { id: string } }) {
  if (!params.id) {
    notFound();
  }
  
  const groupData = await getGroupForProfile(params.id);

  if (!groupData) {
    notFound();
  }
  
  return <GroupProfileClient group={groupData as GroupForProfile} />;
}

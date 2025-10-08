
import { auth } from '@/auth';
import { getGroupDetails } from '@/lib/actions';
import { notFound } from 'next/navigation';
import GroupPageClient from './client';
import type { Group, User, GroupMember } from '@prisma/client';

type GroupWithDetails = Group & {
    author: User;
    members: (GroupMember & {
        user: User;
    })[];
};

export default async function GroupPage({ params }: { params: { id: string } }) {
    const session = await auth();
    const groupId = Number(params.id);

    if (isNaN(groupId)) {
        notFound();
    }
    
    const groupDetails = (await getGroupDetails(groupId)) as GroupWithDetails | null;
    
    if (!groupDetails) {
        notFound();
    }

    return (
        <GroupPageClient group={groupDetails} currentUser={session?.user} />
    );
}

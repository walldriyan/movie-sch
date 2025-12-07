import { Suspense } from 'react';
import { getPublicGroups } from '@/lib/actions/groups';
import { getGroupForProfile } from '@/lib/actions';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import GroupsPageClient from './groups-page-client';
import GroupProfileClient from '@/components/group-profile-client';
import type { GroupForProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export const metadata = {
    title: 'Groups | Fiddle',
    description: 'Discover and join groups to access exclusive content and connect with other members.',
};

interface GroupsPageProps {
    searchParams: Promise<{ groupId?: string }>;
}

export default async function GroupsPage({ searchParams }: GroupsPageProps) {
    const session = await auth();
    const resolvedSearchParams = await searchParams;

    // If groupId is provided, show group profile
    if (resolvedSearchParams.groupId) {
        const groupData = await getGroupForProfile(resolvedSearchParams.groupId);

        if (!groupData) {
            notFound();
        }

        return <GroupProfileClient group={groupData as unknown as GroupForProfile} session={session} />;
    }

    // Otherwise show groups list
    const groups = await getPublicGroups(50);

    return (
        <div className="min-h-screen">
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            }>
                <GroupsPageClient
                    groups={groups}
                    session={session}
                />
            </Suspense>
        </div>
    );
}

import { Suspense } from 'react';
import { getPublicGroups } from '@/lib/actions/groups';
import { auth } from '@/auth';
import GroupsPageClient from './groups-page-client';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';

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

    // If groupId is provided, redirect to the group detail page
    if (resolvedSearchParams.groupId) {
        redirect(`/groups/${resolvedSearchParams.groupId}`);
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

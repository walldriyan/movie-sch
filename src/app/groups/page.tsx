import { Suspense } from 'react';
import { getPublicGroups } from '@/lib/actions/groups';
import { auth } from '@/auth';
import GroupsPageClient from './groups-page-client';
import { Loader2 } from 'lucide-react';

export const metadata = {
    title: 'Groups | StreamVault',
    description: 'Discover and join groups to access exclusive content and connect with other members.',
};

export default async function GroupsPage() {
    const session = await auth();

    // Fetch all public groups
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

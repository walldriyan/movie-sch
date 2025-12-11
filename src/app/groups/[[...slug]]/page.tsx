
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { getPublicGroups, getGroupForProfile, getPendingGroupRequests, getUserGroupsExtended, getUserGroupFeed } from '@/lib/actions/groups';
import { ROLES } from '@/lib/permissions';
import GroupListClient from '@/app/groups/group-list-client';
import GroupDetailClient from '@/app/groups/group-detail-client';

export const dynamic = 'force-dynamic';

export default async function GroupsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const session = await auth();
    const currentUser = session?.user || null;

    // SCENARIO 1: Dashboard View (/groups)
    if (!slug || slug.length === 0) {
        const publicGroups = await getPublicGroups(50); // Fetch up to 50 public groups

        let userGroups = { joined: [] as any[], created: [] as any[] };
        let initialFeed = { posts: [] as any[], totalPages: 0 };

        if (currentUser) {
            // Fetch personalized data
            const [uGroups, feed] = await Promise.all([
                getUserGroupsExtended(),
                getUserGroupFeed(1, 10)
            ]);
            userGroups = uGroups as any;
            initialFeed = feed;
        }

        return (
            <GroupListClient
                groups={publicGroups}
                userGroups={userGroups}
                initialFeed={initialFeed}
                currentUser={currentUser}
            />
        );
    }

    // SCENARIO 2: Detail View (/groups/[id])
    // Allow for a second slug for tabs if needed in future (e.g. /groups/[id]/settings), but for now ignore or redirect?
    // Using slug[0] as groupId.
    const groupId = slug[0];
    const group = await getGroupForProfile(groupId);

    if (!group) {
        notFound();
    }

    let pendingRequests: any[] = [];

    // If user is Admin/SuperAdmin/Creator, fetch pending requests
    const isAdmin = currentUser && (currentUser.role === ROLES.SUPER_ADMIN || group.createdById === currentUser.id);

    // We already check permissions inside getPendingGroupRequests, but let's double check context if needed
    // Actually the action throws error if not authorized. So we should only call it if we think we can.
    // getPendingGroupRequests in actions.ts checks for SUPER_ADMIN role strictly currently. 
    // We might need to adjust that action if Group Admins (Creators) should see requests too.
    // Looking at action code: `if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN)`.
    // This seems restrictive if group creator is just a USER_ADMIN or regular USER.
    // But for now, let's wrap it in try-catch or condition.

    if (isAdmin) {
        try {
            pendingRequests = await getPendingGroupRequests(groupId);
        } catch (e) {
            console.error("Failed to fetch pending requests", e);
        }
    }

    return (
        <GroupDetailClient
            group={group}
            currentUser={currentUser}
            initialRequests={pendingRequests}
        />
    );
}

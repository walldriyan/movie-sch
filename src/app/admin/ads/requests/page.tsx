import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { getAdminAdAccessRequests } from '@/lib/actions/ads';
import AdAccessRequestsManager from '@/components/admin/ad-access-requests-manager';

export const metadata = {
    title: 'Ad Access Requests | Admin',
    description: 'Manage user ad key requests',
};

export default async function AdminAdRequestsPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        redirect('/');
    }

    const result = await getAdminAdAccessRequests();
    const requests = result.success ? result.data : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ad Access Requests</h1>
                <p className="text-muted-foreground">
                    Review and approve user requests for advertising access keys.
                </p>
            </div>

            <AdAccessRequestsManager initialRequests={requests} />
        </div>
    );
}

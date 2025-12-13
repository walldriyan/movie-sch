import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import SponsoredAdsManager from '@/components/admin/sponsored-ads-manager';

export const metadata = {
    title: 'All Ads | Admin',
    description: 'Manage all sponsored advertisements',
};

export default async function AdminAdsPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        redirect('/');
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Sponsored Ads Management</h1>
                <p className="text-muted-foreground">
                    View, approve, and manage all sponsored advertisements and payment codes.
                </p>
            </div>

            <SponsoredAdsManager />
        </div>
    );
}


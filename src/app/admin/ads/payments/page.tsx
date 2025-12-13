import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import SponsoredAdsManager from '@/components/admin/sponsored-ads-manager';

export const metadata = {
    title: 'Ad Payment Codes | Admin',
    description: 'Manage ad payment codes',
};

export default async function AdminAdPaymentsPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        redirect('/');
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ad Payment Codes</h1>
                <p className="text-muted-foreground">
                    Generate and manage payment codes for advertising.
                </p>
            </div>

            <SponsoredAdsManager />
        </div>
    );
}


import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { AdPackagesManager } from '@/components/admin/ad-packages-manager';

export const metadata = {
    title: 'Ad Packages | Admin',
    description: 'Manage ad packages and pricing tiers',
};

export default async function AdminAdPackagesPage() {
    const session = await auth();

    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        redirect('/');
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ad Packages</h1>
                <p className="text-muted-foreground">
                    Create and manage advertising packages with different pricing tiers.
                </p>
            </div>

            <AdPackagesManager />
        </div>
    );
}

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
        <div className="max-w-[1600px] mx-auto">
            <SponsoredAdsManager />
        </div>
    );
}


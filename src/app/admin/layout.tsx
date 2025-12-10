import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import ManageLayout from '../manage/layout';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // Server-side protection - SUPER_ADMIN only
    if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
        redirect('/');
    }

    // Use the shared ManageLayout for sidebar
    return <ManageLayout>{children}</ManageLayout>;
}

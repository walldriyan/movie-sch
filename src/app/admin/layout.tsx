import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/admin-sidebar';

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

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <main id="admin-main-content" className="pt-6 pb-12 px-4 sm:px-6 lg:px-8 transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

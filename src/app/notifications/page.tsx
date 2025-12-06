import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getNotifications } from '@/lib/actions/notifications';
import NotificationsClient from './notifications-client';

export const metadata = {
    title: 'Notifications',
    description: 'Manage your notifications and send feedback',
};

export default async function NotificationsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const { items: notifications, total } = await getNotifications({ page: 1, limit: 20 });

    return <NotificationsClient initialNotifications={notifications} totalNotifications={total} />;
}

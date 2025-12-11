
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminPaymentDashboard from '@/components/admin/payments/admin-payment-dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
    const session = await auth();

    if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'USER_ADMIN') {
        redirect('/');
    }

    // Fetch Data
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { price: 'asc' } });

    // Recent 50 payments
    const recentPaymentsRaw = await prisma.paymentRecord.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { user: true, accessKey: true }
    });

    // Recent 50 subscriptions
    const recentSubsRaw = await prisma.userSubscription.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { user: true, plan: true }
    });

    // Key Stats
    const activeKeysCount = await prisma.accessKey.count({ where: { isUsed: false } });
    const totalRevenueRaw = await prisma.paymentRecord.findMany({ select: { amount: true } });
    const totalRevenue = totalRevenueRaw.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen bg-background">
            <h1 className="text-3xl font-bold mb-8">Payment Center</h1>

            <Suspense fallback={<div>Loading Dashboard...</div>}>
                <AdminPaymentDashboard
                    plans={JSON.parse(JSON.stringify(plans))}
                    recentPayments={JSON.parse(JSON.stringify(recentPaymentsRaw))}
                    recentSubs={JSON.parse(JSON.stringify(recentSubsRaw))}
                    stats={{ activeKeysCount, totalRevenue }}
                />
            </Suspense>
        </div>
    );
}

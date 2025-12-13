import { auth } from "@/auth";
import { ROLES } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getAdminPaymentStats, getAllTransactions, getAllSubscriptions, getSubscriptionPlans } from "@/lib/actions/admin/payments";
import { getAllSubscriptionRequests } from "@/lib/actions/payment-actions";
import PaymentDashboard from "@/components/admin/payment-dashboard";

export const metadata = {
    title: "Admin Payment Manager | CineVerse",
    description: "Advanced payment and subscription management for Super Admins",
};

export default async function AdminPaymentsPage() {
    const session = await auth();

    // Strict Role Check
    if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
        redirect("/admin"); // Redirect to basic admin or home
    }

    // Parallel Data Fetching
    const [stats, transactions, subscriptions, plans, requests] = await Promise.all([
        getAdminPaymentStats(),
        getAllTransactions(1, 20), // Default page 1, 20 items
        getAllSubscriptions(1, 20),
        getSubscriptionPlans(),
        getAllSubscriptionRequests()
    ]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <PaymentDashboard
                stats={stats}
                initialTransactions={transactions}
                initialSubscriptions={subscriptions}
                initialRequests={requests}
                plans={plans}
            />
        </div>
    );
}

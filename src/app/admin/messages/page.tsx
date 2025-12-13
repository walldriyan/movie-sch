
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getFeedbackForAdmin } from '@/lib/actions/feedback';
import AdminFeedbackList from '@/components/admin/admin-feedback-list'; // Logic in client component
import { MessageSquare, Inbox } from 'lucide-react';

export default async function AdminMessagesPage() {
    const session = await auth();
    if (session?.user?.role !== ROLES.SUPER_ADMIN) {
        redirect('/');
    }

    const feedbacks = await getFeedbackForAdmin();

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Messages & Requests</h1>
                    <p className="text-muted-foreground">Manage user inquiries and ad requests.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{feedbacks.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unread</CardTitle>
                        <Inbox className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{feedbacks.filter(f => f.status === 'UNREAD').length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-lg rounded-2xl">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ad Requests</CardTitle>
                        <Badge variant="outline" className="text-purple-500 border-purple-500/20 bg-purple-500/10">New</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{feedbacks.filter(f => f.title.includes('[AD_REQUEST]')).length}</div>
                    </CardContent>
                </Card>
            </div>

            <AdminFeedbackList initialFeedbacks={feedbacks as any} />
        </div>
    );
}

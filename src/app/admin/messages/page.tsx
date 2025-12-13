
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
        <div className="max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-2rem)] gap-8 relative isolate">
            <div className="absolute -top-20 -right-20 -z-10 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
            <div className="absolute -bottom-20 -left-20 -z-10 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none opacity-50" />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white/60">Messages & Requests</h1>
                    <p className="text-lg text-muted-foreground/80 font-medium whitespace-nowrap">Manage user inquiries and ad requests.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-400">Total Messages</CardTitle>
                        <MessageSquare className="h-4 w-4 text-blue-500/70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-100">{feedbacks.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-400">Unread</CardTitle>
                        <Inbox className="h-4 w-4 text-orange-500/70" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-100">{feedbacks.filter(f => f.status === 'UNREAD').length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-400">Ad Requests</CardTitle>
                        <Badge variant="outline" className="text-purple-500 border-purple-500/20 bg-purple-500/10 shadow-sm">New</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-100">{feedbacks.filter(f => f.title.includes('[AD_REQUEST]')).length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex-1 min-h-0 pb-4">
                <AdminFeedbackList initialFeedbacks={feedbacks as any} />
            </div>
        </div>
    );
}

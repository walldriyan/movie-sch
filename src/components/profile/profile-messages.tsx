
'use client';

import { useState, useEffect } from 'react';
import { User, Feedback, FeedbackReply, Notification } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createFeedback, getFeedbackForUser } from '@/lib/actions/feedback'; // We will create these actions
import { MessageSquare, Bell, Send, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import ClientSideDate from '../manage/client-side-date';

type ExtendedFeedback = Feedback & {
    replies: (FeedbackReply & { user: User })[];
};

export default function ProfileMessages({ user }: { user: User }) {
    const [activeTab, setActiveTab] = useState('messages');
    const [messageType, setMessageType] = useState<'GENERAL' | 'AD_REQUEST' | 'FEATURE'>('GENERAL');

    // State for new message
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    // State for messages list
    const [feedbacks, setFeedbacks] = useState<ExtendedFeedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMessages();
    }, []);

    async function loadMessages() {
        setLoading(true);
        try {
            const res = await getFeedbackForUser(user.id);
            if (res.success && res.data) {
                setFeedbacks(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSendMessage() {
        if (!subject || !content) {
            toast.error('Please fill in check fields');
            return;
        }

        setIsSending(true);
        try {
            // Prefix title with type for easier filtering in admin
            const finalTitle = `[${messageType}] ${subject}`;
            const res = await createFeedback(finalTitle, content);

            if (res.success) {
                toast.success('Message sent successfully!');
                setSubject('');
                setContent('');
                loadMessages(); // Refresh list
            } else {
                toast.error('Failed to send message');
            }
        } catch (e) {
            toast.error('Error sending message');
        } finally {
            setIsSending(false);
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Communication Hub</h2>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-[#111112] border border-white/[0.02] p-1 rounded-sm w-full md:w-auto grid grid-cols-2 md:flex">
                    <TabsTrigger value="messages" className="rounded-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Messages & Requests
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                        <Bell className="w-4 h-4 mr-2" />
                        Notifications
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 1. New Message Form */}
                        <Card className="bg-[#111112] border border-white/[0.02] text-white rounded-sm shadow-sm h-fit">
                            <CardHeader>
                                <CardTitle className="text-lg">Compose Message</CardTitle>
                                <CardDescription>Send requests, feedback, or inquiries to admins.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        variant={messageType === 'GENERAL' ? 'default' : 'outline'}
                                        onClick={() => setMessageType('GENERAL')}
                                        className="text-xs h-8"
                                    >
                                        General
                                    </Button>
                                    <Button
                                        variant={messageType === 'AD_REQUEST' ? 'default' : 'outline'}
                                        onClick={() => setMessageType('AD_REQUEST')}
                                        className="text-xs h-8"
                                    >
                                        Ad Request
                                    </Button>
                                    <Button
                                        variant={messageType === 'FEATURE' ? 'default' : 'outline'}
                                        onClick={() => setMessageType('FEATURE')}
                                        className="text-xs h-8"
                                    >
                                        Feedback
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Subject</label>
                                    <Input
                                        placeholder="Brief title..."
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Message</label>
                                    <Textarea
                                        placeholder="Type your message here..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white min-h-[120px]"
                                    />
                                </div>

                                <Button
                                    onClick={handleSendMessage}
                                    disabled={isSending}
                                    className="w-full bg-white text-black hover:bg-white/90"
                                >
                                    {isSending ? 'Sending...' : 'Send Message'} <Send className="w-4 h-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>

                        {/* 2. Messages List */}
                        <Card className="lg:col-span-2 bg-[#111112] border border-white/[0.02] text-white rounded-sm shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Conversation History</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[600px] pr-4">
                                    {!loading && feedbacks.length === 0 && (
                                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                                            <p>No messages yet.</p>
                                        </div>
                                    )}
                                    <div className="space-y-4 p-4">
                                        {feedbacks.map((item) => (
                                            <div key={item.id} className="bg-white/5 rounded-sm p-4 border border-white/5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <Badge variant="outline" className="mb-2 border-white/10 text-white/70">
                                                            {item.status}
                                                        </Badge>
                                                        <h4 className="font-semibold text-white">{item.title}</h4>
                                                        <p className="text-xs text-white/40 mt-1">
                                                            <ClientSideDate date={item.createdAt} />
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-white/80 leading-relaxed mb-4 bg-black/20 p-3 rounded-sm">
                                                    {item.description}
                                                </p>

                                                {/* Replies */}
                                                {item.replies.length > 0 && (
                                                    <div className="pl-4 border-l-2 border-white/10 space-y-3 mt-4">
                                                        {item.replies.map(reply => (
                                                            <div key={reply.id} className="bg-white/5 p-3 rounded-sm">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Badge className="bg-purple-500/20 text-purple-300 text-[10px] px-1 py-0">ADMIN</Badge>
                                                                    <span className="text-xs text-white/40"><ClientSideDate date={reply.createdAt} /></span>
                                                                </div>
                                                                <p className="text-sm text-white/90">{reply.message}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card className="bg-[#111112] border border-white/[0.02] text-white rounded-sm">
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-10 text-muted-foreground">
                                <Bell className="w-10 h-10 mx-auto mb-4 opacity-20" />
                                <p>No new notifications.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

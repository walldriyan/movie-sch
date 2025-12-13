'use client';

import { useState, useEffect } from 'react';
import { User, Feedback, FeedbackReply, Notification } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createFeedback, getFeedbackForUser } from '@/lib/actions/feedback';
import { MessageSquare, Bell, Send, Clock, RotateCw, Sparkles, History } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ClientSideDate from '../manage/client-side-date';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
                setFeedbacks(res.data as ExtendedFeedback[]);
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
            const finalTitle = `[${messageType}] ${subject}`;
            const res = await createFeedback(finalTitle, content);

            if (res.success) {
                toast.success('Message sent successfully!');
                setSubject('');
                setContent('');
                loadMessages();
            } else {
                toast.error('Failed to send message');
            }
        } catch (e) {
            toast.error('Error sending message');
        } finally {
            setIsSending(false);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'RESOLVED':
                return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">Resolved</Badge>;
            case 'PENDING':
                return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">Pending</Badge>;
            default:
                return <Badge className="bg-white/10 text-white/60 border-white/20 hover:bg-white/20">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Communication Hub</h2>
                        <p className="text-white/40 text-sm mt-1">Manage your requests and conversations</p>
                    </div>
                    <TabsList className="bg-white/5 border border-white/10 p-1 rounded-full w-full md:w-auto grid grid-cols-2 md:inline-flex">
                        <TabsTrigger value="messages" className="rounded-full px-6 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Messages
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="rounded-full px-6 data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">
                            <Bell className="w-4 h-4 mr-2" />
                            Notifications
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="messages" className="mt-0 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: COMPOSE (4 cols) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-[#111112] border border-white/[0.05] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                                {/* Decorative Background */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10 transition-all duration-1000 group-hover:bg-purple-500/10" />

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                        <Sparkles className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">New Message</h3>
                                        <p className="text-xs text-white/40">Start a new conversation</p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-3">
                                        <label className="text-xs font-medium text-white/60 ml-1">Topic</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['GENERAL', 'AD_REQUEST', 'FEATURE'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setMessageType(type as any)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-300 flex-1",
                                                        messageType === type
                                                            ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                                            : "bg-white/5 text-white/60 border-white/5 hover:border-white/20 hover:text-white hover:bg-white/10"
                                                    )}
                                                >
                                                    {type.replace('_', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-white/60 ml-1">Subject</label>
                                        <Input
                                            placeholder="Brief title..."
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            className="bg-black/20 border-white/10 text-white rounded-xl focus-visible:ring-purple-500/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-white/60 ml-1">Message</label>
                                        <Textarea
                                            placeholder="Type your message here..."
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="bg-black/20 border-white/10 text-white min-h-[150px] rounded-xl focus-visible:ring-purple-500/50 resize-none"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={isSending}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl py-6 font-semibold shadow-lg shadow-purple-900/20 transition-all active:scale-[0.98]"
                                    >
                                        {isSending ? (
                                            <RotateCw className="w-5 h-5 animate-spin mr-2" />
                                        ) : (
                                            <Send className="w-5 h-5 mr-2" />
                                        )}
                                        {isSending ? 'Sending...' : 'Send Message'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: HISTORY (8 cols) */}
                        <div className="lg:col-span-8">
                            <div className="bg-[#111112] border border-white/[0.05] rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col min-h-[600px]">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/5 rounded-xl">
                                            <History className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <h3 className="font-bold text-white text-lg">History</h3>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={loadMessages}
                                        disabled={loading}
                                        className="rounded-xl hover:bg-white/5 text-white/60 hover:text-white"
                                    >
                                        <RotateCw className={cn("w-5 h-5", loading && "animate-spin")} />
                                    </Button>
                                </div>

                                <ScrollArea className="flex-1 p-6 h-[600px]">
                                    {!loading && feedbacks.length === 0 && (
                                        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                                <MessageSquare className="w-10 h-10 text-white/20" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">No messages yet</h3>
                                            <p className="text-white/40 max-w-xs">Start a conversation by creating a new message on the left.</p>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {feedbacks.map((item) => (
                                            <div key={item.id} className="group relative">
                                                {/* Thread Line */}
                                                {item.replies.length > 0 && (
                                                    <div className="absolute left-[2.25rem] top-12 bottom-6 w-[2px] bg-gradient-to-b from-white/10 to-transparent" />
                                                )}

                                                <div className="flex gap-4">
                                                    {/* Avatar */}
                                                    <Avatar className="w-10 h-10 border-2 border-[#111112] shadow-sm shrink-0 bg-indigo-500/20">
                                                        <AvatarImage src={user.image || undefined} />
                                                        <AvatarFallback className="bg-indigo-500 text-white text-xs">{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 space-y-4">
                                                        {/* User Message Bubble */}
                                                        <div className="bg-[#1A1A1C] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition-colors relative">
                                                            <div className="flex justify-between items-start mb-3 gap-4">
                                                                <div>
                                                                    <h4 className="font-bold text-white text-base">{item.title}</h4>
                                                                    <p className="text-xs text-white/40 mt-1 flex items-center gap-1.5">
                                                                        <Clock className="w-3 h-3" />
                                                                        <ClientSideDate date={item.createdAt} />
                                                                    </p>
                                                                </div>
                                                                {getStatusBadge(item.status)}
                                                            </div>
                                                            <p className="text-sm text-white/80 leading-relaxed font-light whitespace-pre-wrap">
                                                                {item.description}
                                                            </p>
                                                        </div>

                                                        {/* Replies */}
                                                        {item.replies.map(reply => (
                                                            <div key={reply.id} className="flex gap-4 ml-2 animate-in slide-in-from-left-4 fade-in duration-500">
                                                                <Avatar className="w-8 h-8 border border-white/10 shrink-0">
                                                                    <AvatarImage src={reply.user.image || undefined} />
                                                                    <AvatarFallback className="bg-purple-600 text-white text-[10px]">AD</AvatarFallback>
                                                                </Avatar>
                                                                <div className="bg-gradient-to-br from-purple-900/20 to-[#1A1A1C] border border-purple-500/10 rounded-2xl rounded-tl-sm p-4 flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="text-xs font-bold text-purple-300">Admin Response</span>
                                                                        <span className="text-[10px] text-white/30">•</span>
                                                                        <span className="text-[10px] text-white/30"><ClientSideDate date={reply.createdAt} /></span>
                                                                    </div>
                                                                    <p className="text-sm text-white/90 leading-relaxed">
                                                                        {reply.message}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="notifications">
                    <div className="bg-[#111112] border border-white/[0.05] rounded-3xl p-12 text-center text-muted-foreground animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 mx-auto mb-6 bg-white/[0.02] rounded-full flex items-center justify-center">
                            <Bell className="w-12 h-12 opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
                        <p className="text-white/40">You have no new notifications at the moment.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

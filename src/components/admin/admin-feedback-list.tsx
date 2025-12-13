'use client';

import { useState, useEffect } from 'react';
import { Feedback, FeedbackReply, FeedbackStatus } from '@prisma/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { replyToFeedback, updateFeedbackStatus } from '@/lib/actions/feedback';
import { generateAdKeyAction } from '@/lib/actions/admin-payment';
import { Loader2, Send, CheckCircle2, MessageSquare, Key, XCircle, RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ClientSideDate from '@/components/manage/client-side-date';

type ExtendedFeedback = Feedback & {
    user: { id: string, name: string | null, image: string | null, email: string | null };
    replies: (FeedbackReply & { user: { id: string, name: string | null, image: string | null } })[];
};

export default function AdminFeedbackList({ initialFeedbacks }: { initialFeedbacks: ExtendedFeedback[] }) {
    const router = useRouter();
    const [feedbacks, setFeedbacks] = useState(initialFeedbacks);
    const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'AD_REQUEST'>('ALL');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Key Gen State
    const [genAmount, setGenAmount] = useState('5000');
    const [isGenerating, setIsGenerating] = useState(false);

    // Sync prop changes (e.g. from refresh) to local state
    useEffect(() => {
        setFeedbacks(initialFeedbacks);
    }, [initialFeedbacks]);

    async function handleRefresh() {
        setIsRefreshing(true);
        router.refresh();
        setTimeout(() => setIsRefreshing(false), 1000);
    }

    const filtered = feedbacks.filter(f => {
        if (filter === 'UNREAD') return f.status === 'UNREAD';
        if (filter === 'AD_REQUEST') return f.title.includes('[AD_REQUEST]');
        return true;
    });

    const selectedFeedback = feedbacks.find(f => f.id === selectedId);

    async function handleReply() {
        if (!selectedId || !replyMessage) return;
        setIsReplying(true);
        try {
            await replyToFeedback(selectedId, replyMessage);
            toast.success('Reply sent');
            setReplyMessage('');
        } catch (e) {
            toast.error('Failed to reply');
        } finally {
            setIsReplying(false);
        }
    }

    async function handleStatusUpdate(status: FeedbackStatus) {
        if (!selectedId) return;
        try {
            await updateFeedbackStatus(selectedId, status);
            toast.success('Status updated');
            setFeedbacks(prev => prev.map(f => f.id === selectedId ? { ...f, status } : f));
        } catch (e) {
            toast.error('Failed');
        }
    }

    async function generateKey() {
        setIsGenerating(true);
        try {
            const res = await generateAdKeyAction(parseInt(genAmount));
            if (res.success && res.code) {
                setReplyMessage(prev => prev + `\n\nHere is your Access Code: ${res.code}\nValue: ${genAmount} LKR`);
                toast.success('Key generated and added to reply');
            } else {
                toast.error('Failed to generate key');
            }
        } catch (e) { toast.error('Error'); }
        finally { setIsGenerating(false); }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* List */}
            <Card className="md:col-span-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b space-y-4 flex items-center gap-2">
                    <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Messages</SelectItem>
                            <SelectItem value="UNREAD">Unread Only</SelectItem>
                            <SelectItem value="AD_REQUEST">Ad Requests</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        title="Refresh Messages"
                    >
                        <RotateCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="divide-y">
                        {filtered.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={cn(
                                    "w-full text-left p-4 hover:bg-muted/50 transition-colors",
                                    selectedId === item.id ? "bg-muted" : "",
                                    item.status === 'UNREAD' ? "font-semibold" : ""
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="truncate max-w-[150px]">{item.user.name || 'User'}</span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap"><ClientSideDate date={item.createdAt} formatString="MM/dd" /></span>
                                </div>
                                <h4 className="text-sm truncate mb-1">{item.title}</h4>
                                <div className="flex gap-2">
                                    <Badge variant={item.status === 'UNREAD' ? 'default' : 'secondary'} className="text-[10px] h-5">{item.status}</Badge>
                                    {item.title.includes('[AD_REQUEST]') && <Badge variant="outline" className="text-[10px] h-5 border-purple-500 text-purple-500">AD</Badge>}
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Detail */}
            <Card className="md:col-span-2 flex flex-col overflow-hidden">
                {selectedFeedback ? (
                    <div className="flex flex-col h-full">
                        <div className="p-6 border-b bg-card">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedFeedback.title}</h2>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <span>From: {selectedFeedback.user.name} ({selectedFeedback.user.email})</span>
                                        <span>•</span>
                                        <ClientSideDate date={selectedFeedback.createdAt} />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {selectedFeedback.status !== 'CLOSED' && (
                                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate('CLOSED')}>
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Close Ticket
                                        </Button>
                                    )}
                                    {selectedFeedback.status === 'UNREAD' && (
                                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate('READ')}>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Mark Read
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-md text-sm whitespace-pre-wrap">
                                {selectedFeedback.description}
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-6">
                                {selectedFeedback.replies.map((reply) => (
                                    <div key={reply.id} className={cn("flex gap-4 max-w-[80%]", reply.userId === selectedFeedback.userId ? "" : "ml-auto flex-row-reverse")}>
                                        <div className={cn("p-4 rounded-xl text-sm", reply.userId === selectedFeedback.userId ? "bg-muted" : "bg-primary text-primary-foreground")}>
                                            <p>{reply.message}</p>
                                            <div className="text-[10px] opacity-70 mt-2 text-right">
                                                <ClientSideDate date={reply.createdAt} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t bg-card mt-auto">
                            {/* Ad Key Helper */}
                            {selectedFeedback.title.includes('[AD_REQUEST]') && (
                                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md flex items-center gap-4">
                                    <Key className="w-4 h-4 text-purple-500" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium">Generate Amount:</span>
                                        <Select value={genAmount} onValueChange={setGenAmount}>
                                            <SelectTrigger className="h-7 w-[100px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1000">1000 LKR</SelectItem>
                                                <SelectItem value="2500">2500 LKR</SelectItem>
                                                <SelectItem value="5000">5000 LKR</SelectItem>
                                                <SelectItem value="10000">10000 LKR</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={generateKey} disabled={isGenerating}>
                                            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Generate & Attach"}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="min-h-[80px]"
                                />
                                <Button className="h-auto px-6" onClick={handleReply} disabled={isReplying || !replyMessage}>
                                    {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                        <p>Select a message to view conversation</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

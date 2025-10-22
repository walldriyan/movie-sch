
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { getFeedbackForAdmin, updateFeedbackStatus, replyToFeedback } from '@/lib/actions';
import { FeedbackStatus } from '@prisma/client';
import type { Feedback, User, FeedbackReply } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquareWarning, RefreshCw, Send, User as UserIcon, Calendar, Mail, Loader2, ChevronsUpDown, CheckCircle, Clock, Info, Check, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ClientSideDate from '@/components/manage/client-side-date';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

type FeedbackWithRelations = Feedback & {
  user: User;
  replies: (FeedbackReply & { user: User })[];
};

const statusColors: Record<FeedbackStatus, string> = {
  UNREAD: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  READ: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  CLOSED: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const statusIcons: Record<FeedbackStatus, React.ReactNode> = {
    UNREAD: <Mail className="h-4 w-4" />,
    READ: <Eye className="h-4 w-4" />,
    CLOSED: <CheckCircle className="h-4 w-4" />,
}

function ReplyForm({ feedbackId, onReplySent }: { feedbackId: string; onReplySent: () => void }) {
  const [message, setMessage] = useState('');
  const [isReplying, startReplying] = useTransition();
  const { toast } = useToast();

  const handleReply = () => {
    if (message.trim().length < 5) {
      toast({ variant: 'destructive', title: 'Reply too short' });
      return;
    }
    startReplying(async () => {
      try {
        await replyToFeedback(feedbackId, message);
        toast({ title: 'Reply Sent' });
        setMessage('');
        onReplySent();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  return (
    <div className="mt-4 space-y-2">
      <Textarea
        placeholder="Write your reply..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isReplying}
      />
      <div className="flex justify-end">
        <Button onClick={handleReply} disabled={isReplying || !message.trim()}>
          {isReplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send Reply
        </Button>
      </div>
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<FeedbackWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, startRefresh] = useTransition();
  const { toast } = useToast();

  const fetchFeedback = async () => {
    startRefresh(async () => {
        try {
            const data = await getFeedbackForAdmin();
            setFeedbackList(data as FeedbackWithRelations[]);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching feedback', description: error.message });
        } finally {
            setIsLoading(false);
        }
    });
  };

  useEffect(() => {
    fetchFeedback();
  }, []);
  
  const handleStatusChange = async (id: string, status: FeedbackStatus) => {
    try {
        await updateFeedbackStatus(id, status);
        toast({ title: "Status Updated" });
        fetchFeedback();
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }
  
  const renderSkeleton = () => (
      <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg"><Skeleton className="h-20 w-full" /></div>
              <div className="p-4 border rounded-lg"><Skeleton className="h-20 w-full" /></div>
          </CardContent>
      </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl flex items-center gap-2">
          <MessageSquareWarning className="h-6 w-6" /> User Feedback
        </h1>
        <Button variant="outline" size="icon" onClick={fetchFeedback} disabled={isRefreshing || isLoading}>
          <RefreshCw className={cn('h-4 w-4', (isRefreshing || isLoading) && 'animate-spin')} />
        </Button>
      </div>

      {isLoading ? renderSkeleton() : (
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>{feedbackList.length} feedback submissions received.</CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackList.length > 0 ? (
                 <Accordion type="single" collapsible className="w-full">
                    {feedbackList.map((feedback) => (
                        <AccordionItem value={feedback.id} key={feedback.id}>
                            <AccordionTrigger className={cn("p-4 rounded-lg hover:bg-muted/50 transition-colors", statusColors[feedback.status])}>
                                <div className="flex items-center gap-4 text-left">
                                     <div className="flex items-center gap-2">
                                        {statusIcons[feedback.status]}
                                        <Badge variant="outline" className="hidden sm:inline-flex">{feedback.status}</Badge>
                                     </div>
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={feedback.user.image || ''} />
                                        <AvatarFallback>{feedback.user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <p className="font-semibold">{feedback.title}</p>
                                        <p className="text-sm text-muted-foreground">{feedback.user.name}</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-6 bg-muted/20">
                               <p className="whitespace-pre-wrap mb-4">{feedback.description}</p>
                               {feedback.imageUrl && (
                                   <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="relative w-48 h-32 rounded-md overflow-hidden cursor-pointer mb-4">
                                                <Image src={feedback.imageUrl} alt="Feedback attachment" layout="fill" className="object-cover" />
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl h-[80vh]">
                                            <DialogHeader><DialogTitle>Image Attachment</DialogTitle></DialogHeader>
                                            <div className="relative h-full w-full">
                                                <Image src={feedback.imageUrl} alt="Feedback attachment" layout="fill" className="object-contain" />
                                            </div>
                                        </DialogContent>
                                   </Dialog>
                               )}

                                <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 mb-6">
                                    <div className="flex items-center gap-2"><UserIcon className="h-3 w-3" /> {feedback.user.name}</div>
                                    <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {feedback.user.email}</div>
                                    <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> <ClientSideDate date={feedback.createdAt} formatString="PPP" /></div>
                                </div>
                                
                                <div className="space-y-4">
                                  {feedback.replies.map(reply => (
                                    <div key={reply.id} className="flex gap-3">
                                      <Avatar className="h-8 w-8">
                                          <AvatarImage src={reply.user.image || ''} />
                                          <AvatarFallback>{reply.user.name?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div className="p-3 rounded-lg bg-background w-full">
                                        <div className="flex items-center justify-between">
                                           <p className="font-semibold text-sm">{reply.user.name}</p>
                                           <p className="text-xs text-muted-foreground"><ClientSideDate date={reply.createdAt} formatString="PPp"/></p>
                                        </div>
                                        <p className="text-sm mt-1">{reply.message}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <ReplyForm feedbackId={feedback.id} onReplySent={fetchFeedback} />

                                <div className="mt-6 flex items-center gap-2">
                                    <Label className="text-sm">Status:</Label>
                                    <Select defaultValue={feedback.status} onValueChange={(value) => handleStatusChange(feedback.id, value as FeedbackStatus)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(FeedbackStatus).map(s => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">No Feedback Yet</h3>
                    <p className="text-muted-foreground mt-2 text-sm">When users submit feedback, it will appear here.</p>
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

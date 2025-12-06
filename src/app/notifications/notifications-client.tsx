'use client';

import { useState, useTransition, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Bell, Search, Check, CheckCheck, Trash2, Filter,
    MessageSquarePlus, Sparkles, Clock, Send, Image as ImageIcon,
    X, Loader2, ChevronDown, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateNotificationStatus } from '@/lib/actions/notifications';
import { submitFeedback } from '@/lib/actions/feedback';
import { useToast } from '@/hooks/use-toast';
import ClientRelativeDate from '@/components/client-relative-date';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Types
interface Notification {
    id: string;
    title: string;
    message: string;
    status: 'READ' | 'UNREAD';
    createdAt: string;
}

interface NotificationsClientProps {
    initialNotifications: Notification[];
    totalNotifications: number;
}

const FILTER_TABS = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: 'Unread' },
    { value: 'read', label: 'Read' },
];

// Notification Card
function NotificationCard({
    notification,
    onMarkAsRead,
    onDelete
}: {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const isUnread = notification.status === 'UNREAD';

    return (
        <div className={cn(
            "relative flex gap-4 p-4 rounded-xl transition-all",
            "bg-white/[0.02] border border-white/[0.06]",
            isUnread && "border-l-2 border-l-blue-500 bg-blue-500/[0.03]"
        )}>
            {/* Icon */}
            <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                isUnread ? "bg-blue-500/10" : "bg-white/[0.05]"
            )}>
                <Bell className={cn("h-5 w-5", isUnread ? "text-blue-400" : "text-white/40")} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h3 className={cn(
                        "font-medium text-sm",
                        isUnread ? "text-white" : "text-white/70"
                    )}>
                        {notification.title}
                    </h3>
                    <span className="text-[11px] text-white/40 flex-shrink-0">
                        <ClientRelativeDate date={notification.createdAt} />
                    </span>
                </div>
                <p className="text-xs text-white/50 mt-1 line-clamp-2">{notification.message}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {isUnread && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/40 hover:text-green-400"
                        onClick={() => onMarkAsRead(notification.id)}
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-red-400"
                    onClick={() => onDelete(notification.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// Feedback Form Schema
const feedbackSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

// Feedback Dialog
function FeedbackDialog() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, startTransition] = useTransition();
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<FeedbackFormValues>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: { title: '', description: '' },
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({ variant: 'destructive', title: 'File too large (max 5MB)' });
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setPreviewImage(null);
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onSubmit = (values: FeedbackFormValues) => {
        startTransition(async () => {
            try {
                const formData = new FormData();
                formData.append('title', values.title);
                formData.append('description', values.description);
                if (imageFile) formData.append('image', imageFile);

                await submitFeedback(formData);
                toast({ title: 'Feedback sent!', description: 'Thank you for your feedback.' });
                form.reset();
                setPreviewImage(null);
                setImageFile(null);
                setOpen(false);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-full h-10 px-5">
                    <MessageSquarePlus className="h-4 w-4" />
                    Send Feedback
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Send Feedback to Admin</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Brief summary of your feedback" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Please describe your feedback in detail..."
                                            className="min-h-[120px] resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Image Upload */}
                        {previewImage ? (
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                                <Image src={previewImage} alt="Preview" fill className="object-cover" />
                                <button
                                    type="button"
                                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center"
                                    onClick={removeImage}
                                >
                                    <X className="h-3 w-3 text-white" />
                                </button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon className="h-4 w-4" />
                                Attach Screenshot (optional)
                            </Button>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />

                        <div className="flex justify-end pt-4 border-t">
                            <Button type="submit" disabled={isSubmitting} className="gap-2">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Send Feedback
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// Main Component
export default function NotificationsClient({
    initialNotifications,
    totalNotifications
}: NotificationsClientProps) {
    const { toast } = useToast();
    const [notifications, setNotifications] = useState(initialNotifications);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState('all');
    const [isPending, startTransition] = useTransition();

    const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        let result = [...notifications];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(n =>
                n.title.toLowerCase().includes(query) ||
                n.message.toLowerCase().includes(query)
            );
        }

        if (filterTab === 'unread') {
            result = result.filter(n => n.status === 'UNREAD');
        } else if (filterTab === 'read') {
            result = result.filter(n => n.status === 'READ');
        }

        return result;
    }, [notifications, searchQuery, filterTab]);

    const handleMarkAsRead = (notificationId: string) => {
        startTransition(async () => {
            try {
                await updateNotificationStatus(notificationId, 'READ');
                setNotifications(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, status: 'READ' as const } : n)
                );
                toast({ title: 'Marked as read' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error' });
            }
        });
    };

    const handleMarkAllAsRead = () => {
        startTransition(async () => {
            try {
                const unreadIds = notifications.filter(n => n.status === 'UNREAD').map(n => n.id);
                await Promise.all(unreadIds.map(id => updateNotificationStatus(id, 'READ')));
                setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' as const })));
                toast({ title: 'All marked as read' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error' });
            }
        });
    };

    const handleDelete = (notificationId: string) => {
        startTransition(async () => {
            try {
                await updateNotificationStatus(notificationId, 'DELETED');
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                toast({ title: 'Notification deleted' });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error' });
            }
        });
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="relative pt-16 pb-8 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/[0.06] rounded-full blur-[100px]" />
                    <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-purple-500/[0.05] rounded-full blur-[80px]" />
                </div>

                <div className="relative max-w-2xl mx-auto px-4 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/60 text-xs mb-6">
                        <Bell className="w-3.5 h-3.5" />
                        <span>Notification Center</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                        <span className="text-white">Your </span>
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Notifications
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
                        Manage your notifications and send feedback to the admin
                    </p>

                    {/* Stats + Feedback Button */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        {unreadCount > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                                <Bell className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-white/80">{unreadCount} unread</span>
                            </div>
                        )}
                        <FeedbackDialog />
                    </div>

                    {/* Search */}
                    <div className="max-w-md mx-auto relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-11 bg-white/[0.03] border-white/[0.08] rounded-xl"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center justify-center gap-2">
                        {FILTER_TABS.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setFilterTab(tab.value)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs font-medium transition-all",
                                    filterTab === tab.value
                                        ? "bg-white/[0.1] text-white"
                                        : "text-white/40 hover:text-white/60"
                                )}
                            >
                                {tab.label}
                                {tab.value === 'unread' && unreadCount > 0 && (
                                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px]">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 pb-16">
                {/* Actions Bar */}
                {unreadCount > 0 && (
                    <div className="flex items-center justify-end mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/50 hover:text-white gap-2"
                            onClick={handleMarkAllAsRead}
                            disabled={isPending}
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                        </Button>
                    </div>
                )}

                {/* Notifications List */}
                {filteredNotifications.length > 0 ? (
                    <div className="space-y-3">
                        {filteredNotifications.map(notification => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={handleMarkAsRead}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <Bell className="h-12 w-12 text-white/15 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white/70 mb-2">
                            {searchQuery || filterTab !== 'all' ? 'No notifications found' : 'No notifications yet'}
                        </h3>
                        <p className="text-white/40 text-sm">
                            {searchQuery || filterTab !== 'all' ? 'Try different filters' : "You're all caught up!"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

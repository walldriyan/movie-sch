'use client';

import { useState, useTransition, useCallback } from 'react';
import { getNotifications, getPosts } from '@/lib/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    Film,
    Loader2,
    ChevronDown,
    Activity,
    Sparkles,
    Clock,
    ArrowRight,
    Eye
} from 'lucide-react';
import Link from 'next/link';
import ClientRelativeDate from '@/components/client-relative-date';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Modern Activity Card
const ActivityCard = ({
    item,
    type,
    index
}: {
    item: any;
    type: 'notification' | 'post';
    index: number;
}) => {
    const isPost = type === 'post';

    return (
        <Link
            href={isPost ? `/movies/${item.id}` : '#'}
            prefetch={true}
            className={cn(
                "group relative flex gap-4 p-4 rounded-xl transition-all duration-300",
                "bg-gradient-to-r from-white/5 to-transparent",
                "hover:from-white/10 hover:to-white/5",
                "border border-white/5 hover:border-white/10",
                "animate-in fade-in slide-in-from-bottom-2",
            )}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {/* Thumbnail or Icon */}
            <div className="relative flex-shrink-0">
                {isPost && item.posterUrl ? (
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden ring-1 ring-white/10">
                        <Image
                            src={item.posterUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ) : (
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        "bg-gradient-to-br",
                        type === 'notification'
                            ? "from-blue-500/20 to-blue-600/10 text-blue-400"
                            : "from-purple-500/20 to-purple-600/10 text-purple-400"
                    )}>
                        {type === 'notification' ? <Bell className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h3 className={cn(
                        "font-semibold text-sm line-clamp-1 transition-colors",
                        "group-hover:text-primary"
                    )}>
                        {item.title}
                    </h3>
                    <Badge variant="outline" className="flex-shrink-0 text-[10px] bg-white/5 border-white/10">
                        <Clock className="w-3 h-3 mr-1" />
                        <ClientRelativeDate date={item.createdAt || item.updatedAt} />
                    </Badge>
                </div>

                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {type === 'notification' ? item.message : item.description || `by ${item.author?.name || 'Unknown'}`}
                </p>

                {isPost && (
                    <div className="flex items-center gap-3 mt-2">
                        {item.genres?.slice(0, 2).map((genre: string) => (
                            <Badge key={genre} variant="secondary" className="text-[10px] bg-white/5">
                                {genre}
                            </Badge>
                        ))}
                        {item.year && (
                            <span className="text-[10px] text-muted-foreground">{item.year}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Hover Arrow */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-primary" />
            </div>
        </Link>
    );
};

// Section Component
const ActivitySection = ({
    title,
    icon: Icon,
    iconColor,
    items,
    total,
    type,
    fetcher
}: {
    title: string;
    icon: React.ElementType;
    iconColor: string;
    items: any[];
    total: number;
    type: 'notification' | 'post';
    fetcher: (page: number, limit: number) => Promise<{ items: any[]; hasMore: boolean }>;
}) => {
    const [displayItems, setDisplayItems] = useState(items);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(items.length < total);
    const [isPending, startTransition] = useTransition();

    const loadMore = useCallback(() => {
        startTransition(async () => {
            const nextPage = page + 1;
            const { items: newItems, hasMore: more } = await fetcher(nextPage, 5);
            setDisplayItems(prev => [...prev, ...newItems]);
            setHasMore(more);
            setPage(nextPage);
        });
    }, [page, fetcher]);

    if (total === 0) return null;

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-3">
                <div className={cn(
                    "p-2 rounded-xl",
                    "bg-gradient-to-br",
                    iconColor
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="font-bold text-lg">{title}</h2>
                    <p className="text-xs text-muted-foreground">{total} items</p>
                </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
                {displayItems.map((item, index) => (
                    <ActivityCard key={item.id} item={item} type={type} index={index} />
                ))}
            </div>

            {/* Load More */}
            {hasMore && (
                <Button
                    onClick={loadMore}
                    disabled={isPending}
                    variant="ghost"
                    className="w-full group hover:bg-white/5"
                >
                    {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <ChevronDown className="mr-2 h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                    )}
                    Load More
                </Button>
            )}
        </div>
    );
};

interface ActivityPageClientProps {
    initialData: {
        notifications: any[];
        posts: any[];
        totalNotifs: number;
        totalPosts: number;
    };
}

export default function ActivityPageClient({ initialData }: ActivityPageClientProps) {
    const { notifications, posts, totalNotifs, totalPosts } = initialData;
    const hasActivity = totalNotifs > 0 || totalPosts > 0;

    return (
        <main className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

                <div className="relative container mx-auto max-w-3xl py-12 px-4">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 backdrop-blur-sm">
                            <Activity className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                My Activity
                            </h1>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Your recent notifications and updates
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    {hasActivity && (
                        <div className="flex gap-4 mt-6 mb-8">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                                <Bell className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-medium">{totalNotifs} Notifications</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                                <Film className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-medium">{totalPosts} New Posts</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto max-w-3xl px-4 pb-16">
                {!hasActivity ? (
                    <Card className="text-center border-dashed border-white/10 bg-white/5 backdrop-blur-sm">
                        <CardContent className="py-20 flex flex-col items-center gap-4">
                            <div className="p-4 rounded-full bg-gradient-to-br from-white/10 to-white/5">
                                <Eye className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">No Activity Yet</h3>
                                <p className="text-muted-foreground mt-2 max-w-sm">
                                    Your recent notifications and updates will appear here. Start exploring to get personalized activity!
                                </p>
                            </div>
                            <Button asChild className="mt-4">
                                <Link href="/explore">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Explore Content
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-10">
                        {/* Notifications Section */}
                        <ActivitySection
                            title="Notifications"
                            icon={Bell}
                            iconColor="from-blue-500/20 to-blue-600/10 text-blue-400"
                            items={notifications}
                            total={totalNotifs}
                            type="notification"
                            fetcher={async (p, l) => {
                                const { items, total } = await getNotifications({ page: p, limit: l });
                                return { items, hasMore: (p * l) < total };
                            }}
                        />

                        {/* Divider */}
                        {totalNotifs > 0 && totalPosts > 0 && (
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" />
                                </div>
                            </div>
                        )}

                        {/* New Posts Section */}
                        <ActivitySection
                            title="New Posts"
                            icon={Film}
                            iconColor="from-purple-500/20 to-purple-600/10 text-purple-400"
                            items={posts}
                            total={totalPosts}
                            type="post"
                            fetcher={async (p, l) => {
                                const { posts, totalPosts } = await getPosts({ page: p, limit: l });
                                return { items: posts, hasMore: (p * l) < totalPosts };
                            }}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}

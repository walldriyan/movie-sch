'use client';

import { useState, useTransition, useCallback, useMemo } from 'react';
import { getNotifications, getPosts } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    Film,
    Loader2,
    ChevronDown,
    Sparkles,
    Clock,
    ArrowRight,
    Eye,
    MessageSquare,
    Heart,
    Users,
    Search,
    Filter as FilterIcon
} from 'lucide-react';
import Link from 'next/link';
import ClientRelativeDate from '@/components/client-relative-date';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

// Filter types
const FILTER_TYPES = [
    { value: 'all', label: 'All', icon: Sparkles },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'posts', label: 'New Posts', icon: Film },
];

const TIME_FILTERS = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
];

// Activity Card Component
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
                "bg-white/[0.02] hover:bg-white/[0.05]",
                "border border-white/[0.06] hover:border-white/[0.1]",
            )}
        >
            {/* Thumbnail or Icon */}
            <div className="relative flex-shrink-0">
                {isPost && item.posterUrl ? (
                    <div className="relative w-14 h-18 rounded-lg overflow-hidden ring-1 ring-white/10">
                        <Image
                            src={item.posterUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                    </div>
                ) : (
                    <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center",
                        type === 'notification'
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-purple-500/10 text-purple-400"
                    )}>
                        {type === 'notification' ? <Bell className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm text-white group-hover:text-primary transition-colors line-clamp-1">
                        {item.title}
                    </h3>
                    <span className="text-[11px] text-white/40 flex-shrink-0">
                        <ClientRelativeDate date={item.createdAt || item.updatedAt} />
                    </span>
                </div>

                <p className="text-xs text-white/50 mt-1 line-clamp-2">
                    {type === 'notification' ? item.message : item.description || `by ${item.author?.name || 'Unknown'}`}
                </p>

                {isPost && item.year && (
                    <span className="text-[10px] text-white/30 mt-1 inline-block">{item.year}</span>
                )}
            </div>

            {/* Hover Arrow */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-primary" />
            </div>
        </Link>
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

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all');
    const [displayNotifications, setDisplayNotifications] = useState(notifications);
    const [displayPosts, setDisplayPosts] = useState(posts);
    const [notifPage, setNotifPage] = useState(1);
    const [postPage, setPostPage] = useState(1);
    const [hasMoreNotifs, setHasMoreNotifs] = useState(notifications.length < totalNotifs);
    const [hasMorePosts, setHasMorePosts] = useState(posts.length < totalPosts);
    const [isPendingNotif, startNotifTransition] = useTransition();
    const [isPendingPost, startPostTransition] = useTransition();

    // Filter items
    const filteredNotifications = useMemo(() => {
        let result = [...displayNotifications];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(n =>
                n.title?.toLowerCase().includes(query) ||
                n.message?.toLowerCase().includes(query)
            );
        }

        if (timeFilter !== 'all') {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            result = result.filter(n => {
                const date = new Date(n.createdAt);
                switch (timeFilter) {
                    case 'today': return date >= startOfToday;
                    case 'week': return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    case 'month': return date >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    default: return true;
                }
            });
        }

        return result;
    }, [displayNotifications, searchQuery, timeFilter]);

    const filteredPosts = useMemo(() => {
        let result = [...displayPosts];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            );
        }

        if (timeFilter !== 'all') {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            result = result.filter(p => {
                const date = new Date(p.createdAt || p.updatedAt);
                switch (timeFilter) {
                    case 'today': return date >= startOfToday;
                    case 'week': return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    case 'month': return date >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    default: return true;
                }
            });
        }

        return result;
    }, [displayPosts, searchQuery, timeFilter]);

    const showNotifications = filterType === 'all' || filterType === 'notifications';
    const showPosts = filterType === 'all' || filterType === 'posts';
    const hasActivity = totalNotifs > 0 || totalPosts > 0;

    const loadMoreNotifs = useCallback(() => {
        startNotifTransition(async () => {
            const nextPage = notifPage + 1;
            const { items, total } = await getNotifications({ page: nextPage, limit: 5 });
            setDisplayNotifications(prev => [...prev, ...items]);
            setHasMoreNotifs((nextPage * 5) < total);
            setNotifPage(nextPage);
        });
    }, [notifPage]);

    const loadMorePosts = useCallback(() => {
        startPostTransition(async () => {
            const nextPage = postPage + 1;
            const { posts: newPosts, totalPosts: total } = await getPosts({ page: nextPage, limit: 5 });
            setDisplayPosts(prev => [...prev, ...newPosts]);
            setHasMorePosts((nextPage * 5) < total);
            setPostPage(nextPage);
        });
    }, [postPage]);

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
                        <span>Activity Center</span>
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
                        Stay updated with your latest notifications and activity
                    </p>

                    {/* Stats */}
                    {hasActivity && (
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                                <Bell className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-white/80">{totalNotifs}</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                                <Film className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-white/80">{totalPosts}</span>
                            </div>
                        </div>
                    )}

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
                    <div className="flex items-center justify-center gap-2 mb-4">
                        {FILTER_TYPES.map(filter => (
                            <button
                                key={filter.value}
                                onClick={() => setFilterType(filter.value)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all",
                                    filterType === filter.value
                                        ? "bg-white/[0.1] text-white"
                                        : "text-white/40 hover:text-white/60"
                                )}
                            >
                                <filter.icon className="h-3.5 w-3.5" />
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Time Filter */}
                    <div className="flex items-center justify-center gap-2">
                        {TIME_FILTERS.map(filter => (
                            <button
                                key={filter.value}
                                onClick={() => setTimeFilter(filter.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                                    timeFilter === filter.value
                                        ? "bg-white/[0.08] text-white"
                                        : "text-white/30 hover:text-white/50"
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 pb-16">
                {!hasActivity ? (
                    <div className="text-center py-20 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <Eye className="h-12 w-12 text-white/15 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white/70 mb-2">No Activity Yet</h3>
                        <p className="text-white/40 text-sm max-w-sm mx-auto mb-6">
                            Your notifications and updates will appear here
                        </p>
                        <Button asChild>
                            <Link href="/explore">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Explore Content
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Notifications Section */}
                        {showNotifications && filteredNotifications.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-blue-500/10">
                                        <Bell className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-white">Notifications</h2>
                                        <p className="text-xs text-white/40">{filteredNotifications.length} items</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {filteredNotifications.map((item, index) => (
                                        <ActivityCard key={item.id} item={item} type="notification" index={index} />
                                    ))}
                                </div>

                                {hasMoreNotifs && filterType !== 'posts' && (
                                    <Button
                                        onClick={loadMoreNotifs}
                                        disabled={isPendingNotif}
                                        variant="ghost"
                                        className="w-full text-white/50 hover:text-white hover:bg-white/[0.05]"
                                    >
                                        {isPendingNotif ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <ChevronDown className="mr-2 h-4 w-4" />
                                        )}
                                        Load More
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Divider */}
                        {showNotifications && showPosts && filteredNotifications.length > 0 && filteredPosts.length > 0 && (
                            <div className="border-t border-white/[0.06]" />
                        )}

                        {/* Posts Section */}
                        {showPosts && filteredPosts.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-purple-500/10">
                                        <Film className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-white">New Posts</h2>
                                        <p className="text-xs text-white/40">{filteredPosts.length} items</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {filteredPosts.map((item, index) => (
                                        <ActivityCard key={item.id} item={item} type="post" index={index} />
                                    ))}
                                </div>

                                {hasMorePosts && filterType !== 'notifications' && (
                                    <Button
                                        onClick={loadMorePosts}
                                        disabled={isPendingPost}
                                        variant="ghost"
                                        className="w-full text-white/50 hover:text-white hover:bg-white/[0.05]"
                                    >
                                        {isPendingPost ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <ChevronDown className="mr-2 h-4 w-4" />
                                        )}
                                        Load More
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Empty filter state */}
                        {((showNotifications && filteredNotifications.length === 0) ||
                            (showPosts && filteredPosts.length === 0)) &&
                            (searchQuery || timeFilter !== 'all') && (
                                <div className="text-center py-12 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                                    <Search className="h-8 w-8 text-white/15 mx-auto mb-3" />
                                    <p className="text-white/50 font-medium">No results found</p>
                                    <p className="text-white/30 text-sm mt-1">Try different filters</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-4 text-white/50"
                                        onClick={() => { setSearchQuery(''); setTimeFilter('all'); }}
                                    >
                                        Clear filters
                                    </Button>
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}

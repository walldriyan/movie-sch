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
    Filter as FilterIcon,
    Calendar,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import ClientRelativeDate from '@/components/client-relative-date';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

// Filter types
const FILTER_TYPES = [
    { value: 'all', label: 'All Activity', icon: Sparkles },
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
                "group relative flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                "bg-white/[0.02] hover:bg-white/[0.04]",
                "border border-white/[0.04] hover:border-white/[0.08]",
                "hover:shadow-lg hover:shadow-black/20"
            )}
        >
            {/* Thumbnail or Icon */}
            <div className="relative flex-shrink-0 pt-1">
                {isPost && item.posterUrl ? (
                    <div className="relative w-12 h-16 rounded-lg overflow-hidden ring-1 ring-white/10 shadow-sm">
                        <Image
                            src={item.posterUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>
                ) : (
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border border-white/5",
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
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-base text-white/90 group-hover:text-white transition-colors line-clamp-1">
                        {item.title}
                    </h3>
                    <span className="text-[11px] text-white/40 flex-shrink-0 whitespace-nowrap bg-white/[0.03] px-2 py-0.5 rounded-full">
                        <ClientRelativeDate date={item.createdAt || item.updatedAt} />
                    </span>
                </div>

                <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
                    {type === 'notification' ? item.message : item.description || `Posted by ${item.author?.name || 'Unknown'}`}
                </p>

                {isPost && (
                    <div className="flex items-center gap-3 mt-3">
                        {item.year && (
                            <div className="flex items-center gap-1.5 text-[10px] text-white/40 bg-white/[0.03] px-2 py-0.5 rounded-full">
                                <Calendar className="w-3 h-3" />
                                <span>{item.year}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">
                            <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                            New Post
                        </div>
                    </div>
                )}
            </div>

            {/* Hover Arrow */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-primary" />
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
        <div className="min-h-screen bg-transparent pt-[100px] pb-12">

            {/* Rounded Hero Card */}
            <div className="mx-4 lg:mx-[100px] mb-8 relative">
                <div className="h-[250px] w-full rounded-[32px] overflow-hidden relative group">
                    {/* Dark/Abstract Background with Suno Vibe */}
                    <Image
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80"
                        alt="Activity Background"
                        fill
                        className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                        priority
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-white/80 font-medium tracking-wide text-sm uppercase">Fiddle Activity</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                            Activity Center
                        </h1>
                        <p className="text-white/60 max-w-lg text-lg">
                            Track your updates, notifications, and new content releases in one place.
                        </p>
                    </div>
                </div>
            </div>

            {/* Split Layout Container */}
            <div className="mx-4 lg:mx-[100px]">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* LEFT COLUMN - Activity List (75% width) */}
                    <div className="lg:col-span-3 space-y-8">

                        {!hasActivity ? (
                            <div className="text-center py-20 rounded-[32px] bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
                                <Eye className="h-12 w-12 text-white/15 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white/70 mb-2">No Activity Yet</h3>
                                <p className="text-white/40 text-base max-w-sm mx-auto mb-8">
                                    Your notifications and updates will appear here
                                </p>
                                <Button asChild className="rounded-full px-8 py-6 text-base bg-white/10 hover:bg-white/20 border-0">
                                    <Link href="/explore">
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Explore Content
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Notifications Section */}
                                {showNotifications && filteredNotifications.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2 px-2">
                                            <Bell className="w-5 h-5 text-blue-400" />
                                            <h2 className="text-xl font-bold text-white">Notifications</h2>
                                        </div>

                                        <div className="space-y-3">
                                            {filteredNotifications.map((item, index) => (
                                                <ActivityCard key={item.id} item={item} type="notification" index={index} />
                                            ))}
                                        </div>

                                        {hasMoreNotifs && filterType !== 'posts' && (
                                            <div className="pt-2">
                                                <Button
                                                    onClick={loadMoreNotifs}
                                                    disabled={isPendingNotif}
                                                    variant="ghost"
                                                    className="w-full h-12 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.05] border border-white/[0.02]"
                                                >
                                                    {isPendingNotif ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <ChevronDown className="mr-2 h-4 w-4" />
                                                    )}
                                                    Load More Notifications
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Posts Section */}
                                {showPosts && filteredPosts.length > 0 && (
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center gap-3 mb-2 px-2">
                                            <Film className="w-5 h-5 text-purple-400" />
                                            <h2 className="text-xl font-bold text-white">New Posts</h2>
                                        </div>

                                        <div className="space-y-3">
                                            {filteredPosts.map((item, index) => (
                                                <ActivityCard key={item.id} item={item} type="post" index={index} />
                                            ))}
                                        </div>

                                        {hasMorePosts && filterType !== 'notifications' && (
                                            <div className="pt-2">
                                                <Button
                                                    onClick={loadMorePosts}
                                                    disabled={isPendingPost}
                                                    variant="ghost"
                                                    className="w-full h-12 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.05] border border-white/[0.02]"
                                                >
                                                    {isPendingPost ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <ChevronDown className="mr-2 h-4 w-4" />
                                                    )}
                                                    Load More Posts
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Empty filter state */}
                                {((showNotifications && filteredNotifications.length === 0) ||
                                    (showPosts && filteredPosts.length === 0)) &&
                                    (searchQuery || timeFilter !== 'all') && (
                                        <div className="text-center py-20 rounded-[32px] bg-white/[0.02] border border-white/[0.06]">
                                            <Search className="h-10 w-10 text-white/15 mx-auto mb-4" />
                                            <p className="text-white/50 text-lg font-medium">No results found</p>
                                            <p className="text-white/30 text-sm mt-2">Try adjusting your filters</p>
                                            <Button
                                                variant="link"
                                                className="mt-4 text-primary"
                                                onClick={() => { setSearchQuery(''); setTimeFilter('all'); }}
                                            >
                                                Clear all filters
                                            </Button>
                                        </div>
                                    )}
                            </>
                        )}
                    </div>

                    {/* RIGHT COLUMN - Tools/Filter Panel (25% width) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">

                            {/* Search Tool */}
                            <div className="p-5 rounded-2xl bg-[#121212]/50 border border-white/[0.06] backdrop-blur-xl">
                                <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                                    <Search className="w-4 h-4" />
                                    Search
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                                    <Input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-10 pl-9 bg-black/40 border-white/10 rounded-lg text-sm placeholder:text-white/20 focus:bg-black/60 focus:border-white/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Type Filters */}
                            <div className="p-5 rounded-2xl bg-[#121212]/50 border border-white/[0.06] backdrop-blur-xl">
                                <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                                    <FilterIcon className="w-4 h-4" />
                                    Filter by Type
                                </h3>
                                <div className="space-y-2">
                                    {FILTER_TYPES.map(filter => (
                                        <button
                                            key={filter.value}
                                            onClick={() => setFilterType(filter.value)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                                                filterType === filter.value
                                                    ? "bg-white/10 text-white font-medium"
                                                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <filter.icon className={cn(
                                                    "w-4 h-4",
                                                    filterType === filter.value ? "text-white" : "text-white/30"
                                                )} />
                                                {filter.label}
                                            </div>
                                            {filterType === filter.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Filters */}
                            <div className="p-5 rounded-2xl bg-[#121212]/50 border border-white/[0.06] backdrop-blur-xl">
                                <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Time Period
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {TIME_FILTERS.map(filter => (
                                        <button
                                            key={filter.value}
                                            onClick={() => setTimeFilter(filter.value)}
                                            className={cn(
                                                "px-2 py-2 rounded-lg text-xs font-medium transition-all text-center border",
                                                timeFilter === filter.value
                                                    ? "bg-white/10 text-white border-white/10"
                                                    : "bg-transparent text-white/40 border-transparent hover:bg-white/5 hover:text-white/60"
                                            )}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-white/[0.06] backdrop-blur-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Overview</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-2xl font-bold text-white mb-1">{totalNotifs}</div>
                                        <div className="text-[10px] text-white/40">Notifications</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white mb-1">{totalPosts}</div>
                                        <div className="text-[10px] text-white/40">New Posts</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

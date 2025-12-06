'use client';

import { useState, useTransition, useCallback, useMemo } from 'react';
import { getNotifications, getPosts } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import {
    Bell,
    Film,
    Loader2,
    ChevronDown,
    Sparkles,
    Clock,
    ArrowRight,
    Eye,
    Heart,
    Search,
    Filter as FilterIcon,
    Calendar,
    Activity,
    Award,
    Settings,
    User,
    Compass,
    LayoutGrid,
    FileText
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
    { value: 'favorites', label: 'Favorites', icon: Heart },
    { value: 'exams', label: 'Exams & Results', icon: Award },
];

const TIME_FILTERS = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
];

const SHORTCUTS = [
    { label: 'Explore Content', href: '/explore', icon: Compass, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'My Profile', href: '/profile', icon: User, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Settings', href: '/settings', icon: Settings, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
];

// Activity Card Component
const ActivityCard = ({
    item,
    type,
    index
}: {
    item: any;
    type: string;
    index: number;
}) => {
    const isPost = type === 'post' || type === 'favorite';
    const isExam = type === 'exam';
    const isNotification = type === 'notification';

    let href = '#';
    if (isPost) href = `/movies/${item.id}`;
    if (isExam) href = `/admin/exams/${item.id}`; // Simple link logic

    return (
        <Link
            href={href}
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
                    <div className="relative w-12 h-16 rounded-lg overflow-hidden ring-1 ring-white/10 shadow-sm bg-gradient-to-br from-black via-zinc-950 to-red-950">
                        <Image
                            src={item.posterUrl}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {type === 'favorite' && (
                            <div className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                                <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border border-white/5",
                        isNotification ? "bg-blue-500/10 text-blue-400" :
                            isExam ? "bg-emerald-500/10 text-emerald-400" :
                                type === 'favorite' ? "bg-pink-500/10 text-pink-400" :
                                    "bg-purple-500/10 text-purple-400"
                    )}>
                        {isNotification && <Bell className="w-5 h-5" />}
                        {isExam && <Award className="w-5 h-5" />}
                        {type === 'favorite' && <Heart className="w-5 h-5" />}
                        {type === 'post' && <Film className="w-5 h-5" />}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-base text-white/90 group-hover:text-white transition-colors line-clamp-1">
                        {item.title || item.name}
                    </h3>
                    <span className="text-[11px] text-white/40 flex-shrink-0 whitespace-nowrap bg-white/[0.03] px-2 py-0.5 rounded-full">
                        <ClientRelativeDate date={item.createdAt || item.updatedAt || item.date} />
                    </span>
                </div>

                <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
                    {isNotification ? item.message :
                        isExam ? (item.description || "Exam Available") :
                            (item.description || `Posted by ${item.author?.name || 'Unknown'}`)}
                </p>

                {isPost && (
                    <div className="flex items-center gap-3 mt-3">
                        {item.year && (
                            <div className="flex items-center gap-1.5 text-[10px] text-white/40 bg-white/[0.03] px-2 py-0.5 rounded-full">
                                <Calendar className="w-3 h-3" />
                                <span>{item.year}</span>
                            </div>
                        )}
                        {type === 'post' && (
                            <div className="flex items-center gap-1.5 text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">
                                <span className="w-1 h-1 rounded-full bg-purple-400 animate-pulse" />
                                New Post
                            </div>
                        )}
                        {type === 'favorite' && (
                            <div className="flex items-center gap-1.5 text-[10px] bg-pink-500/10 text-pink-300 px-2 py-0.5 rounded-full">
                                <Heart className="w-3 h-3 fill-pink-300" />
                                Liked
                            </div>
                        )}
                    </div>
                )}

                {isExam && (
                    <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1.5 text-[10px] bg-white/[0.05] text-white/60 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            {item.durationMinutes} mins
                        </div>
                        {item.latestSubmission ? (
                            <div className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full">
                                <Award className="w-3 h-3" />
                                Score: {item.latestSubmission.score}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full">
                                <FileText className="w-3 h-3" />
                                Start Exam
                            </div>
                        )}
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
        favorites: any[];
        exams: any[];
        totalNotifs: number;
        totalPosts: number;
    };
}

export default function ActivityPageClient({ initialData }: ActivityPageClientProps) {
    const { notifications, posts, favorites = [], exams = [], totalNotifs, totalPosts } = initialData;

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

    // Unified Item List
    const allItems = useMemo(() => {
        const n = displayNotifications.map(i => ({ ...i, type: 'notification', date: i.createdAt }));
        const p = displayPosts.map(i => ({ ...i, type: 'post', date: i.createdAt }));
        const f = favorites.map(i => ({ ...i, type: 'favorite', date: i.createdAt }));
        const e = exams.map(i => ({ ...i, type: 'exam', date: i.createdAt }));

        let merged = [];
        if (filterType === 'all') merged = [...n, ...p, ...f, ...e];
        else if (filterType === 'notifications') merged = [...n];
        else if (filterType === 'posts') merged = [...p];
        else if (filterType === 'favorites') merged = [...f];
        else if (filterType === 'exams') merged = [...e];

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            merged = merged.filter(item =>
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.message && item.message.toLowerCase().includes(query)) ||
                (item.description && item.description.toLowerCase().includes(query)) ||
                (item.name && item.name.toLowerCase().includes(query))
            );
        }

        // Time Filter
        if (timeFilter !== 'all') {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            merged = merged.filter(item => {
                const date = new Date(item.date);
                switch (timeFilter) {
                    case 'today': return date >= startOfToday;
                    case 'week': return date >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    case 'month': return date >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    default: return true;
                }
            });
        }

        // Sort by Date Descending
        return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [displayNotifications, displayPosts, favorites, exams, filterType, searchQuery, timeFilter]);

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
                <div className="h-[250px] w-full rounded-[32px] overflow-hidden relative group bg-gradient-to-br from-black via-zinc-950 to-red-950">
                    <Image
                        src="https://images.unsplash.com/photo-1620641788421-7f1c33b74051?w=1600&q=80"
                        alt="Activity Background"
                        fill
                        className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                        priority
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

                    <div className="absolute inset-0 flex flex-col justify-end p-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-white/80 font-medium tracking-wide text-sm uppercase">User Dashboard</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                            Activity Center
                        </h1>
                        <p className="text-white/60 max-w-lg text-lg">
                            Manage your notifications, favorites, exams and latest activity in one place.
                        </p>
                    </div>
                </div>
            </div>

            {/* Split Layout Container */}
            <div className="mx-4 lg:mx-[100px]">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* LEFT COLUMN - Activity List (75% width) */}
                    <div className="lg:col-span-3 space-y-8">

                        {allItems.length === 0 ? (
                            <div className="text-center py-20 rounded-[32px] bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
                                <Eye className="h-12 w-12 text-white/15 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white/70 mb-2">No Activity Found</h3>
                                <p className="text-white/40 text-base max-w-sm mx-auto mb-8">
                                    {searchQuery ? "Try adjusting your search or filters" : "Your activity stream is empty right now"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2 px-2">
                                    <h2 className="text-xl font-bold text-white">
                                        {FILTER_TYPES.find(f => f.value === filterType)?.label}
                                    </h2>
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-white/40">
                                        {allItems.length}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {allItems.map((item, index) => (
                                        <ActivityCard key={`${item.type}-${item.id}`} item={item} type={item.type} index={index} />
                                    ))}
                                </div>

                                {/* Load More Buttons */}
                                {(filterType === 'all' || filterType === 'notifications') && hasMoreNotifs && (
                                    <Button
                                        onClick={loadMoreNotifs}
                                        disabled={isPendingNotif}
                                        variant="ghost"
                                        className="w-full text-white/50 hover:text-white hover:bg-white/[0.05]"
                                    >
                                        {isPendingNotif ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                                        Load More Notifications
                                    </Button>
                                )}
                                {(filterType === 'all' || filterType === 'posts') && hasMorePosts && (
                                    <Button
                                        onClick={loadMorePosts}
                                        disabled={isPendingPost}
                                        variant="ghost"
                                        className="w-full text-white/50 hover:text-white hover:bg-white/[0.05]"
                                    >
                                        {isPendingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                                        Load More Posts
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN - Tools/Filter Panel (25% width) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">

                            {/* Shortcuts Widget */}
                            <div className="p-5 rounded-2xl bg-[#121212]/50 border border-white/[0.06] backdrop-blur-xl">
                                <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4" />
                                    Quick Shortcuts
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {SHORTCUTS.map((shortcut) => (
                                        <Link
                                            key={shortcut.label}
                                            href={shortcut.href}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all group"
                                        >
                                            <div className={cn("p-2 rounded-lg", shortcut.bg)}>
                                                <shortcut.icon className={cn("w-4 h-4", shortcut.color)} />
                                            </div>
                                            <span className="text-sm text-white/60 group-hover:text-white font-medium">{shortcut.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Search Tool */}
                            <div className="p-5 rounded-2xl bg-[#121212]/50 border border-white/[0.06] backdrop-blur-xl">
                                <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                                    <Search className="w-4 h-4" />
                                    Search Activity
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

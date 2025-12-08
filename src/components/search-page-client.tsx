'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search, Play, Info, ChevronRight, Film, Tv, Folder,
    Clock, TrendingUp, Star, Calendar, Sparkles, ArrowRight,
    Lock, Users, Globe,
    Bell, GraduationCap, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/types';
import ClientRelativeDate from './client-relative-date';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
    Pagination, PaginationContent, PaginationItem,
    PaginationNext, PaginationPrevious
} from './ui/pagination';


// Default images for posts without posters
const DEFAULT_POSTER_IMAGES = [
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
    'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
    'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&q=80',
    'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&q=80',
];

const getDefaultPoster = (postId: number) => {
    return DEFAULT_POSTER_IMAGES[postId % DEFAULT_POSTER_IMAGES.length];
};

// Helper to safely get genres as array (handles string or array)
const getGenresArray = (genres: string | string[] | null | undefined): string[] => {
    if (!genres) return [];
    if (Array.isArray(genres)) return genres;
    if (typeof genres === 'string') return genres.split(',').map(g => g.trim()).filter(Boolean);
    return [];
};

// Type filters
const TYPE_FILTERS = [
    { value: '', label: 'All', icon: Film },
    { value: 'MOVIE', label: 'Movies', icon: Film },
    { value: 'TV_SERIES', label: 'TV Series', icon: Tv },
    { value: 'OTHER', label: 'Other', icon: Folder },
];

// Time filters
const TIME_FILTERS = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
];

// Sort options
const SORT_OPTIONS = [
    { value: 'updatedAt-desc', label: 'Latest', icon: Clock },
    { value: 'updatedAt-asc', label: 'Oldest', icon: Clock },
    { value: 'imdbRating-desc', label: 'Top Rated', icon: Star },
];

// ========================================
// MOVIE/POST CARD COMPONENT - Modern Card Style
// ========================================
function PostCard({ post, variant = 'normal' }: {
    post: Post;
    variant?: 'featured' | 'normal' | 'compact';
}) {
    const defaultImage = getDefaultPoster(post.id);
    const [imgSrc, setImgSrc] = useState(post.posterUrl || defaultImage);
    const [imgError, setImgError] = useState(false);

    const handleImageError = () => {
        if (!imgError) {
            setImgError(true);
            setImgSrc(defaultImage);
        }
    };

    return (
        <Link
            href={`/movies/${post.id}`}
            className="group block"
        >
            <div className={cn(
                "relative overflow-hidden rounded-xl bg-card border border-white/5",
                "transition-all duration-300 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1",
                variant === 'featured' ? 'aspect-[16/9]' : variant === 'compact' ? 'aspect-[2/3]' : 'aspect-[2/3]'
            )}>
                {/* Image Container */}
                <div className="absolute inset-0">
                    <Image
                        src={imgSrc}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={handleImageError}
                    />
                    {/* Image Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                    {/* Type Badge */}
                    <div className="absolute top-3 left-3 z-10">
                        <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white font-medium uppercase tracking-wider">
                            {post.type === 'MOVIE' ? 'Movie' : post.type === 'TV_SERIES' ? 'Series' : 'Other'}
                        </span>
                    </div>

                    {/* Rating Badge */}
                    {post.imdbRating && (
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-yellow-500/20 backdrop-blur-md border border-yellow-500/20">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] text-yellow-400 font-bold">{post.imdbRating}</span>
                        </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        </div>
                    </div>
                </div>

                {/* Content Section Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 z-10">
                    {/* Genres */}
                    {getGenresArray(post.genres).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                            {getGenresArray(post.genres).slice(0, 2).map((genre, idx) => (
                                <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded-sm bg-purple-500/20 text-[9px] text-purple-200 font-medium"
                                >
                                    {genre}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <h3 className={cn(
                        "text-white font-bold leading-tight line-clamp-2 group-hover:text-purple-300 transition-colors",
                        variant === 'featured' ? 'text-2xl mb-2' : 'text-base mb-1'
                    )}>
                        {post.title}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-[11px] text-white/50 font-medium">
                        <div className="flex items-center gap-2">
                            <span>{post.year || 'N/A'}</span>
                            {post.duration && (
                                <>
                                    <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
                                    <span>{post.duration}</span>
                                </>
                            )}
                        </div>
                        <ClientRelativeDate date={post.updatedAt} />
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ========================================
// HERO FEATURED POST COMPONENT
// ========================================

// Helper to extract YouTube video ID
function getYouTubeVideoId(url: string | null | undefined): string | null {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function HeroSection({ post, onSearch }: {
    post: Post | null;
    onSearch: (query: string) => void;
}) {
    const [localQuery, setLocalQuery] = useState('');
    const [imgError, setImgError] = useState(false);

    // Check if post has a valid image
    const hasValidImage = post?.posterUrl && post.posterUrl.trim() !== '' && !imgError;

    // Check for YouTube video in mediaLinks
    const youtubeVideoId = useMemo(() => {
        if (!post?.mediaLinks || !Array.isArray(post.mediaLinks)) return null;
        for (const link of post.mediaLinks) {
            if (typeof link === 'object' && link !== null && 'url' in link) {
                const id = getYouTubeVideoId((link as any).url);
                if (id) return id;
            } else if (typeof link === 'string') {
                const id = getYouTubeVideoId(link);
                if (id) return id;
            }
        }
        return null;
    }, [post?.mediaLinks]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(localQuery);
    };

    return (
        <section className="relative mb-12">
            <div className="relative rounded-3xl overflow-hidden aspect-[21/9] shadow-2xl bg-black border border-white/5 mx-auto">
                {/* Background - YouTube Video, Image, or Gradient */}
                {youtubeVideoId ? (
                    <iframe
                        src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${youtubeVideoId}`}
                        title={post?.title || 'Featured Video'}
                        className="absolute inset-0 w-full h-full object-cover scale-110 pointer-events-none opacity-40"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                ) : hasValidImage ? (
                    <Image
                        src={post!.posterUrl!}
                        alt={post?.title || 'Featured'}
                        fill
                        className="object-cover opacity-60"
                        priority
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent opacity-80" />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 lg:p-16">
                    <div className="max-w-4xl">
                        {post ? (
                            <>
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90 mb-6">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                    <span>{post.type === 'MOVIE' ? 'FEATURED MOVIE' : post.type === 'TV_SERIES' ? 'FEATURED SERIES' : 'TRENDING'}</span>
                                </div>

                                {/* Title */}
                                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight drop-shadow-2xl">
                                    {post.title}
                                </h1>

                                {/* Meta Info */}
                                <div className="flex items-center gap-6 mb-8 text-sm text-white/70 font-medium">
                                    {post.imdbRating && post.imdbRating > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="text-yellow-500 font-bold">{post.imdbRating.toFixed(1)}</span>
                                        </div>
                                    )}
                                    {post.year && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            <span>{post.year}</span>
                                        </div>
                                    )}
                                    {post.duration && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{post.duration}</span>
                                        </div>
                                    )}
                                    {post.viewCount !== undefined && post.viewCount > 0 && (
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            <span>{post.viewCount.toLocaleString()} views</span>
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                {post.description && (
                                    <p className="text-lg text-white/60 max-w-2xl mb-8 line-clamp-2 leading-relaxed">
                                        {post.description.replace(/<[^>]*>/g, '')}
                                    </p>
                                )}

                                {/* CTA Buttons & Search */}
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <Button
                                            asChild
                                            className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8 rounded-full shadow-lg shadow-white/5 transition-transform hover:scale-105"
                                        >
                                            <Link href={`/movies/${post.id}`}>
                                                <Play className="w-5 h-5 mr-2 fill-black" />
                                                Watch Now
                                            </Link>
                                        </Button>
                                    </div>

                                    {/* Search Bar in Hero */}
                                    <form onSubmit={handleSubmit} className="relative w-full md:w-96">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                                        <Input
                                            type="text"
                                            placeholder="Search movies, series..."
                                            value={localQuery}
                                            onChange={(e) => setLocalQuery(e.target.value)}
                                            className="w-full h-12 pl-12 pr-4 bg-white/10 backdrop-blur-md border-white/10 rounded-full text-white placeholder:text-white/30 focus:bg-white/20 focus:border-white/20 transition-all font-medium"
                                        />
                                    </form>
                                </div>
                            </>
                        ) : (
                            /* Empty state */
                            <div className="py-8">
                                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Discover the World of Knowledge</h2>
                                <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                                    <Input
                                        type="text"
                                        placeholder="Search topics, posts, or exams..."
                                        value={localQuery}
                                        onChange={(e) => setLocalQuery(e.target.value)}
                                        className="w-full h-14 pl-12 pr-4 bg-white/10 backdrop-blur-md border-white/10 rounded-full text-white placeholder:text-white/30 focus:bg-white/20 focus:border-white/20 transition-all text-lg"
                                    />
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ========================================
// MAIN SEARCH PAGE CLIENT
// ========================================
interface SearchPageClientProps {
    featuredPost: any | null;
    initialPosts: any[];
    query: string;
    currentType?: string;
    currentTimeFilter: string;
    currentSortBy: string;
    currentPage: number;
    totalPages: number;
    userNotifications?: any[];
    userExams?: any[];
    userGroups?: any[];
    // Explore data
    trendingPosts?: any[];
    newReleases?: any[];
    topRatedPosts?: any[];
    allGenres?: string[];
}

export default function SearchPageClient({
    featuredPost,
    initialPosts,
    query,
    currentType,
    currentTimeFilter,
    currentSortBy,
    currentPage,
    totalPages,
    userNotifications = [],
    userExams = [],
    userGroups = [],
    trendingPosts = [],
    newReleases = [],
    topRatedPosts = [],
    allGenres = [],
}: SearchPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const buildUrl = (params: Record<string, string | undefined>) => {
        const sp = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                sp.set(key, value);
            } else {
                sp.delete(key);
            }
        });
        if (!params.page) {
            sp.set('page', '1');
        }
        return `/search?${sp.toString()}`;
    };

    const handleSearch = (newQuery: string) => {
        router.push(buildUrl({ q: newQuery || undefined }));
    };

    // Grouping
    const groupedPosts = useMemo(() => {
        const lockedPosts = initialPosts.filter(post =>
            (post as any).isLockedByDefault || (post as any).requiresExamToUnlock
        );
        const groupOnlyPosts = initialPosts.filter(post =>
            (post as any).visibility === 'GROUP_ONLY' && (post as any).groupId
        );
        const publicPosts = initialPosts.filter(post =>
            !(post as any).isLockedByDefault &&
            !(post as any).requiresExamToUnlock &&
            (post as any).visibility !== 'GROUP_ONLY'
        );
        return { lockedPosts, groupOnlyPosts, publicPosts };
    }, [initialPosts]);

    return (
        <div className="min-h-screen bg-background pt-24 pb-12">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6">

                {/* Hero Section */}
                <HeroSection post={featuredPost} onSearch={handleSearch} />

                {/* Filters & Tools Bar */}
                <div className="sticky top-20 z-40 mb-8 p-1">
                    <div className="bg-background/80 backdrop-blur-xl border border-white/5 rounded-2xl p-2 shadow-sm">
                        <div className="flex flex-col lg:flex-row items-center gap-4">

                            {/* Type Tabs */}
                            <div className="flex items-center p-1 bg-white/5 rounded-xl">
                                {TYPE_FILTERS.map(filter => {
                                    const Icon = filter.icon;
                                    const isActive = (filter.value === '' && !currentType) || filter.value === currentType;
                                    return (
                                        <Link
                                            key={filter.value}
                                            href={buildUrl({ type: filter.value || undefined })}
                                            scroll={false}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                                isActive
                                                    ? "bg-white/10 text-white shadow-sm"
                                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="hidden sm:inline">{filter.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            <div className="w-px h-8 bg-white/10 hidden lg:block" />

                            {/* Additional Filters */}
                            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                                {TIME_FILTERS.map(filter => (
                                    <Link
                                        key={filter.value}
                                        href={buildUrl({ timeFilter: filter.value })}
                                        scroll={false}
                                        className={cn(
                                            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                            currentTimeFilter === filter.value
                                                ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                                : "bg-transparent border-white/10 text-muted-foreground hover:border-white/20 hover:text-white"
                                        )}
                                    >
                                        {filter.label}
                                    </Link>
                                ))}
                            </div>

                            <div className="ml-auto flex items-center gap-2">
                                <Link
                                    href={buildUrl({ sortBy: currentSortBy === 'updatedAt-desc' ? 'imdbRating-desc' : 'updatedAt-desc' })}
                                    scroll={false}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                    Sort: {SORT_OPTIONS.find(o => o.value === currentSortBy)?.label || 'Latest'}
                                </Link>

                                {(currentType || currentTimeFilter !== 'all' || currentSortBy !== 'updatedAt-desc' || query) && (
                                    <Link
                                        href="/search"
                                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title="Clear all filters"
                                    >
                                        <X className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Access User Stats (if any) */}
                {(userNotifications.length > 0 || userExams.length > 0 || userGroups.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                        {userNotifications.length > 0 && (
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-900/10 to-transparent border border-blue-500/10 hover:border-blue-500/20 transition-colors">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-blue-100 truncate">Notifications</h4>
                                    <p className="text-xs text-blue-300/60 truncate">{userNotifications[0]?.title}</p>
                                </div>
                                <Link href="/notifications" className="text-xs font-bold text-blue-400 hover:text-blue-300 whitespace-nowrap">View All</Link>
                            </div>
                        )}
                        {userExams.length > 0 && (
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-purple-900/10 to-transparent border border-purple-500/10 hover:border-purple-500/20 transition-colors">
                                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-purple-100 truncate">Exams pending</h4>
                                    <p className="text-xs text-purple-300/60">{userExams.length} exams available</p>
                                </div>
                                <Link href="/exams" className="text-xs font-bold text-purple-400 hover:text-purple-300 whitespace-nowrap">Start Now</Link>
                            </div>
                        )}
                        {userGroups.length > 0 && (
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-green-900/10 to-transparent border border-green-500/10 hover:border-green-500/20 transition-colors">
                                <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-green-100 truncate">Your Groups</h4>
                                    <p className="text-xs text-green-300/60 truncate">{userGroups.length} active groups</p>
                                </div>
                                <Link href="/groups" className="text-xs font-bold text-green-400 hover:text-green-300 whitespace-nowrap">View All</Link>
                            </div>
                        )}
                    </div>
                )}

                {/* RESULTS GRID */}
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex items-end justify-between border-b border-white/5 pb-2">
                        <h2 className="text-xl font-bold text-white leading-tight">
                            {query ? `Search Results for "${query}"` : 'Browse Content'}
                        </h2>
                        <span className="text-sm text-muted-foreground">{initialPosts.length} items</span>
                    </div>

                    {initialPosts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
                            {initialPosts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl bg-white/[0.02] border border-white/5 border-dashed">
                            <Film className="w-16 h-16 text-white/10 mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">No results found</h3>
                            <p className="text-muted-foreground mb-8 max-w-sm">We couldn't find anything matching your search. Try different keywords or filters.</p>
                            <Button onClick={() => router.push('/search')} variant="outline" className="border-white/10 hover:bg-white/5">
                                Clear Filters
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pt-12 flex justify-center">
                            <Pagination className="bg-white/5 backdrop-blur-md rounded-full px-4 py-2 border border-white/5 w-auto inline-flex">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href={buildUrl({ page: String(Math.max(1, currentPage - 1)) })}
                                            scroll={true}
                                            className={cn("hover:bg-white/10 hover:text-white transition-colors", currentPage <= 1 && "pointer-events-none opacity-50")}
                                        />
                                    </PaginationItem>
                                    <PaginationItem className="px-4 text-sm font-medium text-white/70">
                                        Page {currentPage} of {totalPages}
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext
                                            href={buildUrl({ page: String(Math.min(totalPages, currentPage + 1)) })}
                                            scroll={true}
                                            className={cn("hover:bg-white/10 hover:text-white transition-colors", currentPage >= totalPages && "pointer-events-none opacity-50")}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </div>

                {/* EXPLORE SECTIONS (Only if no search) */}
                {!query && (
                    <div className="mt-24 space-y-16">
                        {trendingPosts.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="w-6 h-6 text-pink-500" />
                                        Trending Now
                                    </h3>
                                    <Link href="/search?sortBy=viewCount-desc" className="text-sm font-medium text-pink-400 hover:text-pink-300">View All</Link>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {trendingPosts.slice(0, 6).map(post => <PostCard key={post.id} post={post} variant="compact" />)}
                                </div>
                            </section>
                        )}

                        {allGenres.length > 0 && (
                            <section>
                                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                                    <Folder className="w-6 h-6 text-blue-400" />
                                    Browse by Genre
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {allGenres.map(genre => (
                                        <Link
                                            key={genre}
                                            href={`/search?q=${encodeURIComponent(genre)}`}
                                            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all text-sm font-medium text-white/80 hover:text-white"
                                        >
                                            {genre}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

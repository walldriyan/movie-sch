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
    Volume2, VolumeX, Heart, Bookmark, Lock, Users, Globe,
    FileText, Bell, MessageSquare, GraduationCap
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
                "relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08]",
                "transition-all duration-300 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02]",
                variant === 'featured' ? 'h-[380px]' : variant === 'compact' ? 'h-[220px]' : 'h-[320px]'
            )}>
                {/* Image Container */}
                <div className="relative w-full h-[65%] overflow-hidden">
                    <Image
                        src={imgSrc}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={handleImageError}
                    />
                    {/* Image Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Type Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] text-white font-medium">
                            {post.type === 'MOVIE' ? 'Movie' : post.type === 'TV_SERIES' ? 'Series' : 'Other'}
                        </span>
                    </div>

                    {/* Rating Badge */}
                    {post.imdbRating && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/25 backdrop-blur-md">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-[11px] text-yellow-400 font-bold">{post.imdbRating}/10</span>
                        </div>
                    )}

                    {/* Play Button Overlay on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-4 h-[35%] flex flex-col justify-between">
                    {/* Genres */}
                    {getGenresArray(post.genres).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {getGenresArray(post.genres).slice(0, 2).map((genre, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[10px] text-purple-300 font-medium"
                                >
                                    {genre}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <h3 className={cn(
                        "text-white font-semibold leading-tight mb-2 line-clamp-2",
                        variant === 'featured' ? 'text-lg' : 'text-sm'
                    )}>
                        {post.title}
                    </h3>

                    {/* Author & Date Row */}
                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-white/10">
                                <AvatarImage src={post.author?.image || ''} />
                                <AvatarFallback className="text-[9px] bg-gradient-to-br from-purple-500/50 to-pink-500/50 text-white">
                                    {post.author?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] text-white/60 font-medium">{post.author?.name || 'Unknown'}</span>
                        </div>

                        <span className="text-[10px] text-white/40">
                            <ClientRelativeDate date={post.updatedAt} />
                        </span>
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
        <section className="relative overflow-hidden">
            {/* Main Hero Container with 100px margin */}
            <div className="mx-[100px] my-6">
                <div className="relative rounded-3xl overflow-hidden aspect-[21/9]">
                    {/* Background - YouTube Video, Image, or Gradient */}
                    {youtubeVideoId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&mute=1&controls=1&modestbranding=1&rel=0`}
                            title={post?.title || 'Featured Video'}
                            className="absolute inset-0 w-full h-full rounded-3xl"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    ) : hasValidImage ? (
                        <>
                            <Image
                                src={post!.posterUrl!}
                                alt={post?.title || 'Featured'}
                                fill
                                className="object-cover"
                                priority
                                onError={() => setImgError(true)}
                            />
                            {/* Gradient Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        </>
                    ) : (
                        /* Dark black/maroon gradient fallback */
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a0a] via-[#0d0d0d] to-[#0a0a0a]">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-rose-900/30 via-transparent to-transparent" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
                        </div>
                    )}

                    {/* Content Overlay - Only show for image/gradient, not for video */}
                    {!youtubeVideoId && (
                        <div className="absolute inset-0 flex flex-col justify-end p-12">
                            {post ? (
                                <>
                                    {/* Badge */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-semibold w-fit mb-4">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>{post.type === 'MOVIE' ? 'FEATURED POST' : post.type === 'TV_SERIES' ? 'FEATURED SERIES' : 'TRENDING NOW'}</span>
                                    </div>

                                    {/* Title */}
                                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight max-w-3xl">
                                        {post.title}
                                    </h1>

                                    {/* Real Meta Info */}
                                    <div className="flex items-center gap-4 mb-4 text-sm text-white/70 flex-wrap">
                                        {post.imdbRating && post.imdbRating > 0 && (
                                            <span className="flex items-center gap-1.5 bg-yellow-500/20 px-2 py-1 rounded-full">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <span className="text-yellow-400 font-bold">{post.imdbRating.toFixed(1)}</span>
                                            </span>
                                        )}
                                        {post.year && (
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                {post.year}
                                            </span>
                                        )}
                                        {post.duration && (
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4" />
                                                {post.duration}
                                            </span>
                                        )}
                                        {post.viewCount !== undefined && post.viewCount > 0 && (
                                            <span className="flex items-center gap-1.5">
                                                <TrendingUp className="w-4 h-4" />
                                                {post.viewCount.toLocaleString()} views
                                            </span>
                                        )}
                                    </div>

                                    {/* Genres */}
                                    {getGenresArray(post.genres).length > 0 && (
                                        <div className="flex items-center gap-2 mb-5">
                                            {getGenresArray(post.genres).slice(0, 4).map((genre, idx) => (
                                                <span key={idx} className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                                                    {genre}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Description */}
                                    {post.description && (
                                        <p className="text-white/60 text-sm md:text-base max-w-2xl mb-6 line-clamp-2">
                                            {post.description.replace(/<[^>]*>/g, '')}
                                        </p>
                                    )}

                                    {/* CTA Buttons */}
                                    <div className="flex items-center gap-3">
                                        <Button
                                            asChild
                                            className="bg-white text-black hover:bg-white/90 font-semibold h-12 px-8 rounded-full"
                                        >
                                            <Link href={`/movies/${post.id}`}>
                                                <Play className="w-5 h-5 mr-2 fill-black" />
                                                View Details
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            variant="ghost"
                                            className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold h-12 px-6 rounded-full border border-white/20"
                                        >
                                            <Link href={`/movies/${post.id}`}>
                                                <Info className="w-4 h-4 mr-2" />
                                                More Info
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                /* Empty state when no featured post */
                                <div className="text-center py-8">
                                    <h2 className="text-3xl font-bold text-white mb-2">Discover Amazing Content</h2>
                                    <p className="text-white/50">Search for posts, series, and more</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Search Bar - Below hero */}
            <div className="mx-[100px] mb-6">
                <form onSubmit={handleSubmit} className="relative max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                    <Input
                        type="text"
                        placeholder="Search posts, series, topics..."
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-white/[0.03] backdrop-blur-sm border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:bg-white/[0.06] focus:border-purple-500/30"
                    />
                </form>
            </div>
        </section>
    );
}

// ========================================
// TRENDING CARD COMPONENT
// ========================================
function TrendingCard({ genre, post }: { genre: string; post: Post | undefined }) {
    const defaultImage = getDefaultPoster(post?.id || 0);
    const [imgSrc, setImgSrc] = useState(post?.posterUrl || defaultImage);

    return (
        <Link
            href={`/search?q=${encodeURIComponent(genre)}`}
            className="flex-shrink-0 relative w-40 h-28 rounded-xl overflow-hidden group"
        >
            <Image
                src={imgSrc}
                alt={genre}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImgSrc(defaultImage)}
            />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
            <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs text-white font-medium">
                {genre}
            </span>
        </Link>
    );
}

// ========================================
// TRENDING CATEGORY BAR
// ========================================
function TrendingBar({ posts }: { posts: Post[] }) {
    // Get unique genres from posts - hooks must be called unconditionally
    const genres = useMemo(() => {
        if (posts.length === 0) return [];
        const allGenres = posts.flatMap(p => getGenresArray(p.genres));
        const uniqueGenres = [...new Set(allGenres)].slice(0, 6);
        return uniqueGenres;
    }, [posts]);

    // Get posts for each genre
    const genrePosts = useMemo(() => {
        if (posts.length === 0 || genres.length === 0) return [];
        return genres.map(genre => ({
            genre,
            post: posts.find(p => getGenresArray(p.genres).includes(genre)),
        })).filter(g => g.post);
    }, [genres, posts]);

    // Early returns after hooks
    if (posts.length === 0) return null;
    if (genrePosts.length === 0) return null;

    return (
        <section className="py-8 px-[22px]">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Trending Now</h2>
                    <Button variant="ghost" className="text-white/60 hover:text-white">
                        See more <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>

                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    {genrePosts.map(({ genre, post }) => (
                        <TrendingCard key={genre} genre={genre} post={post} />
                    ))}
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
    // Explore data
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
        // Reset to page 1 when filters change
        if (!params.page) {
            sp.set('page', '1');
        }
        return `/search?${sp.toString()}`;
    };

    const handleSearch = (newQuery: string) => {
        router.push(buildUrl({ q: newQuery || undefined }));
    };

    // Permission-based grouping of posts
    const groupedPosts = useMemo(() => {
        // Type-safe access to post properties
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
        <div className="min-h-screen bg-background pt-[80px]">
            {/* Hero Section with Featured Post */}
            <HeroSection post={featuredPost} onSearch={handleSearch} />

            {/* Filter Bar */}
            <section className="px-[100px] py-6">
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Type Filters */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {TYPE_FILTERS.map(filter => {
                                const Icon = filter.icon;
                                const isActive = (filter.value === '' && !currentType) || filter.value === currentType;
                                return (
                                    <Link
                                        key={filter.value}
                                        href={buildUrl({ type: filter.value || undefined })}
                                        scroll={false}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                            isActive
                                                ? "bg-white/[0.1] text-white"
                                                : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {filter.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Time & Sort Filters + Reset */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {TIME_FILTERS.map(filter => (
                                <Link
                                    key={filter.value}
                                    href={buildUrl({ timeFilter: filter.value })}
                                    scroll={false}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                                        currentTimeFilter === filter.value
                                            ? "bg-purple-500/20 text-purple-400"
                                            : "text-white/40 hover:text-white/60 hover:bg-white/[0.05]"
                                    )}
                                >
                                    {filter.label}
                                </Link>
                            ))}

                            <div className="w-px h-4 bg-white/[0.1] mx-2" />

                            {SORT_OPTIONS.map(option => {
                                const Icon = option.icon;
                                return (
                                    <Link
                                        key={option.value}
                                        href={buildUrl({ sortBy: option.value })}
                                        scroll={false}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                                            currentSortBy === option.value
                                                ? "bg-pink-500/20 text-pink-400"
                                                : "text-white/40 hover:text-white/60 hover:bg-white/[0.05]"
                                        )}
                                    >
                                        <Icon className="w-3 h-3" />
                                        {option.label}
                                    </Link>
                                );
                            })}

                            {/* Reset Filters Button */}
                            {(currentType || currentTimeFilter !== 'all' || currentSortBy !== 'updatedAt-desc' || query) && (
                                <>
                                    <div className="w-px h-4 bg-white/[0.1] mx-2" />
                                    <Link
                                        href="/search"
                                        scroll={false}
                                        className="px-3 py-1.5 rounded-full text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all whitespace-nowrap"
                                    >
                                        Reset All
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================
                EXPLORE SECTIONS - Only show when no query
               ======================================== */}
            {!query && (trendingPosts.length > 0 || newReleases.length > 0 || topRatedPosts.length > 0 || allGenres.length > 0) && (
                <div className="space-y-8">
                    {/* Browse by Genre */}
                    {allGenres.length > 0 && (
                        <section className="px-[22px]">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Folder className="w-5 h-5 text-purple-400" />
                                        Browse by Genre
                                    </h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {allGenres.map((genre) => (
                                        <Link
                                            key={genre}
                                            href={`/search?q=${encodeURIComponent(genre)}`}
                                            className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white/80 text-sm font-medium hover:from-purple-500/30 hover:to-pink-500/30 hover:text-white transition-all"
                                        >
                                            {genre}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Trending Section */}
                    {trendingPosts.length > 0 && (
                        <section className="px-[22px]">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-orange-400" />
                                        Trending Now
                                    </h2>
                                    <Link
                                        href="/search?sortBy=viewCount-desc"
                                        className="text-sm text-white/50 hover:text-white flex items-center gap-1"
                                    >
                                        See all <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {trendingPosts.slice(0, 6).map((post) => (
                                        <PostCard key={post.id} post={post} variant="compact" />
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* New Releases Section */}
                    {newReleases.length > 0 && (
                        <section className="px-[22px]">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-green-400" />
                                        New Releases
                                    </h2>
                                    <Link
                                        href="/search?sortBy=publishedAt-desc"
                                        className="text-sm text-white/50 hover:text-white flex items-center gap-1"
                                    >
                                        See all <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {newReleases.slice(0, 6).map((post) => (
                                        <PostCard key={post.id} post={post} variant="compact" />
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Top Rated Section */}
                    {topRatedPosts.length > 0 && (
                        <section className="px-[22px]">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                        Top Rated
                                    </h2>
                                    <Link
                                        href="/search?sortBy=imdbRating-desc"
                                        className="text-sm text-white/50 hover:text-white flex items-center gap-1"
                                    >
                                        See all <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {topRatedPosts.slice(0, 6).map((post) => (
                                        <PostCard key={post.id} post={post} variant="compact" />
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* User-Specific Content Sections */}
            {(userNotifications.length > 0 || userExams.length > 0 || userGroups.length > 0) && (
                <section className="px-[22px] py-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Notifications Card */}
                            {userNotifications.length > 0 && (
                                <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-blue-500/20">
                                            <Bell className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">Notifications</h3>
                                        <span className="ml-auto px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                                            {userNotifications.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {userNotifications.slice(0, 3).map((notif: any, idx: number) => (
                                            <div key={notif.id || idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                                <p className="text-sm text-white font-medium line-clamp-1">{notif.title}</p>
                                                <p className="text-xs text-white/50 line-clamp-1 mt-1">{notif.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <Link href="/notifications" className="flex items-center justify-center gap-2 mt-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors">
                                        View All <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}

                            {/* Exams Card */}
                            {userExams.length > 0 && (
                                <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-purple-500/20">
                                            <GraduationCap className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">Available Exams</h3>
                                        <span className="ml-auto px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                                            {userExams.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {userExams.slice(0, 3).map((exam: any, idx: number) => (
                                            <Link key={exam.id || idx} href={`/exams/${exam.id}`} className="block p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                                                <p className="text-sm text-white font-medium line-clamp-1">{exam.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-white/50">{exam._count?.questions || 0} questions</span>
                                                    {exam.durationMinutes && (
                                                        <>
                                                            <span className="text-white/30">•</span>
                                                            <span className="text-xs text-white/50">{exam.durationMinutes} min</span>
                                                        </>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    <Link href="/exams" className="flex items-center justify-center gap-2 mt-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors">
                                        View All Exams <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}

                            {/* Groups Card */}
                            {userGroups.length > 0 && (
                                <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-green-500/20">
                                            <Users className="w-5 h-5 text-green-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">Groups</h3>
                                        <span className="ml-auto px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                                            {userGroups.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {userGroups.slice(0, 3).map((group: any, idx: number) => (
                                            <Link key={group.id || idx} href={`/groups/${group.id}`} className="block p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-green-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white font-medium line-clamp-1">{group.name}</p>
                                                        <p className="text-xs text-white/50">{group._count?.members || 0} members</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    <Link href="/groups" className="flex items-center justify-center gap-2 mt-4 py-2 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors">
                                        View All Groups <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Results Section */}
            <section className="px-[22px] py-6">
                <div className="max-w-7xl mx-auto">
                    {/* Results Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {query ? `Results for "${query}"` : 'Browse All'}
                            </h2>
                            <p className="text-white/50 text-sm mt-1">
                                {initialPosts.length} items found
                            </p>
                        </div>
                    </div>

                    {initialPosts.length > 0 ? (
                        <div className="space-y-12">
                            {/* Locked/Premium Content Section */}
                            {groupedPosts.lockedPosts.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                                            <Lock className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Premium Content</h3>
                                            <p className="text-sm text-white/50">Locked posts - Exam or subscription required</p>
                                        </div>
                                        <span className="ml-auto px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                                            {groupedPosts.lockedPosts.length} items
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {groupedPosts.lockedPosts.map((post) => (
                                            <PostCard key={post.id} post={post} variant="normal" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Group Only Content Section */}
                            {groupedPosts.groupOnlyPosts.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                                            <Users className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Group Content</h3>
                                            <p className="text-sm text-white/50">Posts visible to group members only</p>
                                        </div>
                                        <span className="ml-auto px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                                            {groupedPosts.groupOnlyPosts.length} items
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {groupedPosts.groupOnlyPosts.map((post) => (
                                            <PostCard key={post.id} post={post} variant="normal" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Public Content Section */}
                            {groupedPosts.publicPosts.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                                            <Globe className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">Public Content</h3>
                                            <p className="text-sm text-white/50">Available to everyone</p>
                                        </div>
                                        <span className="ml-auto px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                                            {groupedPosts.publicPosts.length} items
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {groupedPosts.publicPosts.map((post, index) => {
                                            let variant: 'featured' | 'normal' | 'compact' = 'normal';
                                            if (index % 7 === 0) variant = 'featured';
                                            else if (index % 5 === 4) variant = 'compact';

                                            const spanClass = variant === 'featured' ? 'sm:col-span-2 lg:col-span-2 xl:col-span-1' : '';

                                            return (
                                                <div key={post.id} className={spanClass}>
                                                    <PostCard post={post} variant={variant} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                            <Film className="h-12 w-12 text-white/20 mx-auto mb-4" />
                            <h3 className="text-white/60 font-medium text-lg">No results found</h3>
                            <p className="text-white/40 text-sm mt-2">
                                Try adjusting your search or filters
                            </p>
                            <Button asChild variant="ghost" className="mt-6">
                                <Link href="/search">Clear all filters</Link>
                            </Button>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination className="mt-12">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={buildUrl({ page: String(Math.max(1, currentPage - 1)) })}
                                        scroll={false}
                                        className={cn(
                                            "bg-white/5 hover:bg-white/10 border-white/10",
                                            currentPage <= 1 && "pointer-events-none opacity-50"
                                        )}
                                    />
                                </PaginationItem>

                                <PaginationItem>
                                    <span className="px-4 py-2 rounded-md text-sm font-medium text-white/70">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                </PaginationItem>

                                <PaginationItem>
                                    <PaginationNext
                                        href={buildUrl({ page: String(Math.min(totalPages, currentPage + 1)) })}
                                        scroll={false}
                                        className={cn(
                                            "bg-white/5 hover:bg-white/10 border-white/10",
                                            currentPage >= totalPages && "pointer-events-none opacity-50"
                                        )}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </div>
            </section>
        </div>
    );
}

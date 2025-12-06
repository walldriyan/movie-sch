'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search, Heart, Star, Play, ChevronRight, Bookmark,
    Sparkles, Grid, List, Film, Tv, Trash2, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ClientRelativeDate from '@/components/client-relative-date';
import type { Session } from 'next-auth';
import type { Post } from '@/lib/types';

// Default images
const DEFAULT_POSTER_IMAGES = [
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
    'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
];

const getDefaultPoster = (index: number) => {
    return DEFAULT_POSTER_IMAGES[index % DEFAULT_POSTER_IMAGES.length];
};

// ========================================
// FAVORITE POST CARD
// ========================================
function FavoritePostCard({ post, index }: { post: any; index: number }) {
    const posterImage = post.posterUrl || getDefaultPoster(index);
    const [imgError, setImgError] = useState(false);
    const [imgSrc, setImgSrc] = useState(posterImage);

    return (
        <Link href={`/movies/${post.id}`} className="group block">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] transition-all duration-300 hover:border-pink-500/30 hover:shadow-xl hover:shadow-pink-500/10 hover:scale-[1.02]">
                {/* Image Container */}
                <div className="relative w-full h-[200px] overflow-hidden">
                    <Image
                        src={imgSrc}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={() => {
                            if (!imgError) {
                                setImgError(true);
                                setImgSrc(getDefaultPoster(index));
                            }
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Heart Icon */}
                    <div className="absolute top-3 right-3">
                        <div className="p-2 rounded-full bg-pink-500/20 backdrop-blur-md">
                            <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
                        </div>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] text-white font-medium flex items-center gap-1.5">
                            {post.type === 'MOVIE' ? (
                                <><Film className="w-3 h-3" /> Movie</>
                            ) : post.type === 'TV_SERIES' ? (
                                <><Tv className="w-3 h-3" /> Series</>
                            ) : (
                                'Other'
                            )}
                        </span>
                    </div>

                    {/* Rating */}
                    {post.imdbRating && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 backdrop-blur-md">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-[11px] text-yellow-400 font-bold">{post.imdbRating}/10</span>
                        </div>
                    )}

                    {/* Play Button on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-pink-300 transition-colors">
                        {post.title}
                    </h3>

                    {/* Description */}
                    {post.description && (
                        <p className="text-sm text-white/50 line-clamp-2 mt-1.5 min-h-[40px]">
                            {post.description.replace(/<[^>]*>/g, '').slice(0, 100)}
                        </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 border border-white/10">
                                <AvatarImage src={post.author?.image || ''} />
                                <AvatarFallback className="text-[9px] bg-gradient-to-br from-pink-500/50 to-purple-500/50 text-white">
                                    {post.author?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] text-white/60">{post.author?.name || 'Unknown'}</span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1 text-white/40 text-[10px]">
                            <Clock className="w-3 h-3" />
                            <ClientRelativeDate date={post.updatedAt} />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ========================================
// HERO SECTION
// ========================================
function HeroSection({ totalCount, onSearch, searchQuery }: {
    totalCount: number;
    onSearch: (query: string) => void;
    searchQuery: string;
}) {
    const [localQuery, setLocalQuery] = useState(searchQuery);

    return (
        <section className="relative py-16 px-6 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-background to-purple-900/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent" />

            <div className="relative max-w-4xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium mb-6">
                    <Heart className="w-4 h-4 fill-pink-400" />
                    Your Collection
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    My Favorites
                </h1>

                {/* Description */}
                <p className="text-lg text-white/60 max-w-2xl mx-auto mb-4">
                    Your saved movies, series, and content all in one place.
                </p>

                {/* Stats */}
                <div className="flex items-center justify-center gap-6 mb-8">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5">
                        <Bookmark className="w-5 h-5 text-pink-400" />
                        <span className="text-white font-semibold">{totalCount}</span>
                        <span className="text-white/60">saved items</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-lg mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                    <Input
                        type="text"
                        placeholder="Search favorites..."
                        value={localQuery}
                        onChange={(e) => {
                            setLocalQuery(e.target.value);
                            onSearch(e.target.value);
                        }}
                        className="w-full h-14 pl-12 pr-4 bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:bg-white/15 text-lg"
                    />
                </div>
            </div>
        </section>
    );
}

// ========================================
// EMPTY STATE
// ========================================
function EmptyState() {
    return (
        <div className="min-h-screen bg-background pt-[80px] flex items-center justify-center">
            <div className="text-center px-6 py-20">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
                    <Bookmark className="w-10 h-10 text-pink-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">No Favorites Yet</h1>
                <p className="text-white/60 text-lg max-w-md mx-auto mb-8">
                    You haven't saved any content yet. Browse movies and series, then click the bookmark icon to add them here.
                </p>
                <Button asChild className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                    <Link href="/search">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Browse Content
                    </Link>
                </Button>
            </div>
        </div>
    );
}

// ========================================
// MAIN FAVORITES PAGE CLIENT
// ========================================
interface FavoritesPageClientProps {
    posts: any[];
    session: Session | null;
}

export default function FavoritesPageClient({ posts, session }: FavoritesPageClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filter posts based on search
    const filteredPosts = useMemo(() => {
        if (!searchQuery.trim()) return posts;
        const query = searchQuery.toLowerCase();
        return posts.filter(post =>
            post.title?.toLowerCase().includes(query) ||
            post.description?.toLowerCase().includes(query) ||
            post.author?.name?.toLowerCase().includes(query)
        );
    }, [posts, searchQuery]);

    // Show empty state if no favorites
    if (posts.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="min-h-screen bg-background pt-[80px]">
            {/* Hero Section */}
            <HeroSection
                totalCount={posts.length}
                onSearch={setSearchQuery}
                searchQuery={searchQuery}
            />

            {/* Favorites Grid */}
            <section className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {searchQuery ? `Results for "${searchQuery}"` : 'All Favorites'}
                            </h2>
                            <p className="text-white/50 text-sm mt-1">
                                {filteredPosts.length} items
                            </p>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "rounded-lg",
                                    viewMode === 'grid' ? "bg-white/10 text-white" : "text-white/50"
                                )}
                            >
                                <Grid className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "rounded-lg",
                                    viewMode === 'list' ? "bg-white/10 text-white" : "text-white/50"
                                )}
                            >
                                <List className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Posts Grid */}
                    {filteredPosts.length > 0 ? (
                        <div className={cn(
                            "gap-6",
                            viewMode === 'grid'
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                : "flex flex-col"
                        )}>
                            {filteredPosts.map((post, index) => (
                                <FavoritePostCard key={post.id} post={post} index={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                            <Search className="h-12 w-12 text-white/20 mx-auto mb-4" />
                            <h3 className="text-white/60 font-medium text-lg">No results found</h3>
                            <p className="text-white/40 text-sm mt-2">
                                Try a different search term
                            </p>
                            <Button
                                variant="ghost"
                                className="mt-6"
                                onClick={() => setSearchQuery('')}
                            >
                                Clear search
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

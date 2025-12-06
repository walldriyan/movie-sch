'use client';

import { useState, useTransition, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Film, Loader2, Search, Play, Star, ChevronRight,
    Sparkles, Filter, Grid, List, ArrowLeft, Home, ChevronDown,
    Calendar, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';

interface MoviesPageClientProps {
    initialPosts: any[];
    totalPages: number;
    currentPage: number;
    searchParams: {
        genre?: string;
        year?: string;
        sort?: string;
        page?: string;
    };
}

const GENRES = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance',
    'Sci-Fi', 'Thriller', 'War', 'Western'
];

const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

// ========================================
// MOVIE CARD COMPONENT - Suno.com Style
// ========================================
function MovieCard({ post, index }: { post: any; index: number }) {
    const [imgError, setImgError] = useState(false);
    const hasImage = post.posterUrl && post.posterUrl.trim() !== '' && !imgError;

    return (
        <Link href={`/movies/${post.id}`} className="group block">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] transition-all duration-300 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02]">
                {/* Image Container */}
                <div className="relative w-full aspect-[2/3] overflow-hidden">
                    {hasImage ? (
                        <Image
                            src={post.posterUrl}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        // Gradient placeholder
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-gray-900 to-gray-800 flex items-center justify-center">
                            <Film className="w-12 h-12 text-white/20" />
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    {/* Rating Badge */}
                    {post.imdbRating && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 backdrop-blur-md">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-[11px] text-yellow-400 font-bold">{post.imdbRating.toFixed(1)}</span>
                        </div>
                    )}

                    {/* Year Badge */}
                    {post.year && (
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] text-white font-medium">
                            {post.year}
                        </div>
                    )}

                    {/* Play Button on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="w-14 h-14 rounded-full bg-purple-500/80 backdrop-blur-sm flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                        </div>
                    </div>

                    {/* Bottom Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-base font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                            {post.title}
                        </h3>
                        {post.duration && (
                            <div className="flex items-center gap-1 mt-1.5 text-white/50 text-xs">
                                <Clock className="w-3 h-3" />
                                <span>{post.duration}</span>
                            </div>
                        )}
                        {/* Genres */}
                        {post.genres && post.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {post.genres.slice(0, 2).map((genre: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/60"
                                    >
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ========================================
// MAIN MOVIES PAGE CLIENT
// ========================================
export default function MoviesPageClient({
    initialPosts,
    totalPages,
    currentPage,
    searchParams
}: MoviesPageClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');

    // Build URL with filters
    const buildUrl = useCallback((updates: Record<string, string | undefined>) => {
        const params = new URLSearchParams();
        const current = {
            genre: searchParams.genre,
            year: searchParams.year,
            sort: searchParams.sort,
            page: '1',
            ...updates
        };

        Object.entries(current).forEach(([key, value]) => {
            if (value && value !== 'all') params.set(key, value);
        });

        return `/movies${params.toString() ? `?${params.toString()}` : ''}`;
    }, [searchParams]);

    // Navigate with transition
    const navigateWithTransition = useCallback((url: string) => {
        startTransition(() => {
            router.push(url);
        });
    }, [router]);

    // Handle filter change
    const handleFilterChange = useCallback((key: string, value: string) => {
        navigateWithTransition(buildUrl({ [key]: value === 'all' ? undefined : value }));
    }, [buildUrl, navigateWithTransition]);

    // Handle pagination
    const handlePageChange = useCallback((page: number) => {
        const params = new URLSearchParams();
        if (searchParams.genre) params.set('genre', searchParams.genre);
        if (searchParams.year) params.set('year', searchParams.year);
        if (searchParams.sort) params.set('sort', searchParams.sort);
        params.set('page', page.toString());
        navigateWithTransition(`/movies?${params.toString()}`);
    }, [searchParams, navigateWithTransition]);

    // Filter posts by search query (client-side)
    const filteredPosts = useMemo(() => {
        if (!searchQuery.trim()) return initialPosts;
        const query = searchQuery.toLowerCase();
        return initialPosts.filter(post =>
            post.title?.toLowerCase().includes(query) ||
            post.genres?.some((g: string) => g.toLowerCase().includes(query))
        );
    }, [initialPosts, searchQuery]);

    return (
        <div className={cn(
            "min-h-screen bg-background transition-opacity duration-200 pt-[80px]",
            isPending && "opacity-60 pointer-events-none"
        )}>
            {/* Breadcrumb Navigation */}
            <div className="max-w-7xl mx-auto px-6 py-4">
                <nav className="flex items-center gap-3 text-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <span className="text-white/30">/</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white gap-2"
                    >
                        <Link href="/">
                            <Home className="h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                    <span className="text-white/30">/</span>
                    <span className="text-white">Movies</span>
                </nav>
            </div>

            {/* Hero Section */}
            <section className="relative px-6 py-8 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-background to-pink-900/10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />

                <div className="relative max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                        <div>
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-4">
                                <Sparkles className="w-4 h-4" />
                                Browse Collection
                            </div>

                            {/* Title */}
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                                Movies
                            </h1>
                            <p className="text-lg text-white/60 max-w-lg">
                                Explore our curated collection of movies across all genres
                            </p>
                            {isPending && <Loader2 className="h-5 w-5 animate-spin text-purple-400 mt-3" />}
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            {/* Search Input */}
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                                <Input
                                    type="text"
                                    placeholder="Search movies..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-9 pr-4 bg-white/10 backdrop-blur-sm border-white/20 rounded-xl text-white placeholder:text-white/40"
                                />
                            </div>

                            {/* Genre Filter */}
                            <Select
                                value={searchParams.genre || 'all'}
                                onValueChange={(value) => handleFilterChange('genre', value)}
                            >
                                <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white/80 rounded-xl h-10">
                                    <SelectValue placeholder="Genre" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Genres</SelectItem>
                                    {GENRES.map((genre) => (
                                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Year Filter */}
                            <Select
                                value={searchParams.year || 'all'}
                                onValueChange={(value) => handleFilterChange('year', value)}
                            >
                                <SelectTrigger className="w-[120px] bg-white/10 border-white/20 text-white/80 rounded-xl h-10">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Years</SelectItem>
                                    {YEARS.map((year) => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Clear Filters */}
                            {(searchParams.genre || searchParams.year || searchQuery) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl"
                                    onClick={() => {
                                        setSearchQuery('');
                                        navigateWithTransition('/movies');
                                    }}
                                >
                                    Clear All
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Active Filters Pills */}
                    {(searchParams.genre || searchParams.year) && (
                        <div className="flex items-center gap-2 mt-6">
                            <span className="text-white/40 text-sm">Active filters:</span>
                            {searchParams.genre && (
                                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm">
                                    {searchParams.genre}
                                </span>
                            )}
                            {searchParams.year && (
                                <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-sm">
                                    {searchParams.year}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Content Grid */}
            <section className="px-6 pb-12">
                <div className="max-w-7xl mx-auto">
                    {/* Results Header */}
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-white/50 text-sm">
                            {filteredPosts.length} movies found
                        </p>
                    </div>

                    {/* Movies Grid */}
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                            <Film className="h-16 w-16 mx-auto text-white/20 mb-4" />
                            <h2 className="text-2xl font-semibold text-white mb-2">No Movies Found</h2>
                            <p className="text-white/50 mb-6">
                                Try adjusting your filters to find what you're looking for.
                            </p>
                            <Button
                                onClick={() => {
                                    setSearchQuery('');
                                    navigateWithTransition('/movies');
                                }}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {filteredPosts.map((post, index) => (
                                    <MovieCard key={post.id} post={post} index={index} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Pagination className="mt-12">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={currentPage <= 1}
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                className="bg-white/5 hover:bg-white/10 border-white/10 rounded-full"
                                            >
                                                Previous
                                            </Button>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <span className="px-4 py-2 text-sm text-white/70">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={currentPage >= totalPages}
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                className="bg-white/5 hover:bg-white/10 border-white/10 rounded-full"
                                            >
                                                Next
                                            </Button>
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

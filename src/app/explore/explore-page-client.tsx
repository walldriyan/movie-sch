'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search,
    Film,
    Tv,
    Folder,
    Compass,
    Loader2,
    SlidersHorizontal,
    Sparkles,
    TrendingUp,
    Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PostGrid from '@/components/post-grid';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';

interface ExplorePageClientProps {
    initialPosts: any[];
    totalPages: number;
    currentPage: number;
    searchParams: {
        q?: string;
        type?: string;
        genre?: string;
        year?: string;
        page?: string;
    };
}

const GENRES = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance',
    'Sci-Fi', 'Thriller', 'War', 'Western'
];

const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

export default function ExplorePageClient({
    initialPosts,
    totalPages,
    currentPage,
    searchParams
}: ExplorePageClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState(searchParams.q || '');

    // Build URL with filters
    const buildUrl = useCallback((updates: Record<string, string | undefined>) => {
        const params = new URLSearchParams();
        const current = {
            q: searchParams.q,
            type: searchParams.type,
            genre: searchParams.genre,
            year: searchParams.year,
            page: '1',
            ...updates
        };

        Object.entries(current).forEach(([key, value]) => {
            if (value && value !== 'all') params.set(key, value);
        });

        return `/explore${params.toString() ? `?${params.toString()}` : ''}`;
    }, [searchParams]);

    // Navigate with transition
    const navigateWithTransition = useCallback((url: string) => {
        startTransition(() => {
            router.push(url);
        });
    }, [router]);

    // Handle search
    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        navigateWithTransition(buildUrl({ q: searchQuery || undefined }));
    }, [searchQuery, buildUrl, navigateWithTransition]);

    // Handle filter change
    const handleFilterChange = useCallback((key: string, value: string) => {
        navigateWithTransition(buildUrl({ [key]: value === 'all' ? undefined : value }));
    }, [buildUrl, navigateWithTransition]);

    // Handle pagination
    const handlePageChange = useCallback((page: number) => {
        const params = new URLSearchParams();
        if (searchParams.q) params.set('q', searchParams.q);
        if (searchParams.type) params.set('type', searchParams.type);
        if (searchParams.genre) params.set('genre', searchParams.genre);
        if (searchParams.year) params.set('year', searchParams.year);
        params.set('page', page.toString());
        navigateWithTransition(`/explore?${params.toString()}`);
    }, [searchParams, navigateWithTransition]);

    const typeFilters = [
        { label: 'All', value: 'all', icon: Compass },
        { label: 'Movies', value: 'MOVIE', icon: Film },
        { label: 'TV Series', value: 'TV_SERIES', icon: Tv },
        { label: 'Other', value: 'OTHER', icon: Folder },
    ];

    return (
        <div className={cn(
            "min-h-screen bg-background transition-opacity duration-200",
            isPending && "opacity-60 pointer-events-none"
        )}>
            {/* Hero Section - Suno.com Style */}
            <div className="relative pt-20 pb-12">
                {/* Background gradients */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
                    <div className="absolute top-10 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
                        <Compass className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-white/80">Discover Content</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
                        Explore & Discover
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-white/50 max-w-xl mx-auto mb-8">
                        Find your next favorite movie, TV series, or discover trending content from our community.
                    </p>

                    {/* Search Form - Centered */}
                    <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                            <Input
                                placeholder="Search movies, series, documentaries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12 bg-white/5 border-white/10 rounded-lg text-white placeholder:text-white/40 focus:bg-white/10 focus:border-white/20"
                            />
                        </div>
                        <Button type="submit" className="h-12 px-6 rounded-lg bg-white text-black hover:bg-white/90">
                            Search
                        </Button>
                    </form>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 pb-12">
                {/* Filter Bar - Suno.com Style */}
                <div className="mb-8 rounded-xl overflow-hidden bg-gradient-to-br from-card/60 via-card/40 to-card/30 backdrop-blur-sm border border-white/5 p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Type filters */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {typeFilters.map((filter) => {
                                const Icon = filter.icon;
                                const isActive = (searchParams.type || 'all') === filter.value;
                                return (
                                    <Button
                                        key={filter.value}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleFilterChange('type', filter.value)}
                                        className={cn(
                                            "rounded-md flex items-center gap-2 transition-all",
                                            isActive
                                                ? "bg-white text-black hover:bg-white/90"
                                                : "text-white/70 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {filter.label}
                                    </Button>
                                );
                            })}
                        </div>

                        {/* More filters + Loading indicator */}
                        <div className="flex items-center gap-2">
                            {isPending && <Loader2 className="h-4 w-4 animate-spin text-white/50" />}

                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="sm" className="rounded-md gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/90">
                                        <SlidersHorizontal className="h-4 w-4" />
                                        Filters
                                        {(searchParams.genre || searchParams.year) && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
                                                {[searchParams.genre, searchParams.year].filter(Boolean).length}
                                            </span>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent>
                                    <SheetHeader>
                                        <SheetTitle>Filters</SheetTitle>
                                        <SheetDescription>
                                            Refine your search with additional filters
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="space-y-6 mt-6">
                                        {/* Genre filter */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Genre</label>
                                            <Select
                                                value={searchParams.genre || 'all'}
                                                onValueChange={(value) => handleFilterChange('genre', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Genres" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Genres</SelectItem>
                                                    {GENRES.map((genre) => (
                                                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Year filter */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Year</label>
                                            <Select
                                                value={searchParams.year || 'all'}
                                                onValueChange={(value) => handleFilterChange('year', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="All Years" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Years</SelectItem>
                                                    {YEARS.map((year) => (
                                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Clear button */}
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => navigateWithTransition('/explore')}
                                        >
                                            Clear All Filters
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {initialPosts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                            <Compass className="h-10 w-10 text-white/30" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2 text-white">No Results Found</h2>
                        <p className="text-white/50 mb-6 max-w-md mx-auto">
                            Try adjusting your search or filters to find what you're looking for.
                        </p>
                        <Button
                            onClick={() => navigateWithTransition('/explore')}
                            className="rounded-md bg-white text-black hover:bg-white/90"
                        >
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Results Header */}
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-semibold text-white">
                                {searchParams.q ? `Results for "${searchParams.q}"` : 'Trending Now'}
                            </h2>
                            <span className="text-white/40 text-sm">
                                ({initialPosts.length} items)
                            </span>
                        </div>

                        <PostGrid posts={initialPosts} />

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination className="mt-12">
                                <PaginationContent>
                                    <PaginationItem>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPage <= 1}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            className="rounded-md"
                                        >
                                            Previous
                                        </Button>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <span className="px-4 py-2 text-sm text-white/60">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPage >= totalPages}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            className="rounded-md"
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
        </div>
    );
}

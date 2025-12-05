'use client';

import { useState, useTransition, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search,
    Film,
    Tv,
    Folder,
    Compass,
    Loader2,
    SlidersHorizontal
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
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

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
            page: '1', // Reset to page 1 on filter change
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
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <Compass className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Explore</h1>
                        {isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search movies, series..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-muted/50 border-0"
                            />
                        </div>
                        <Button type="submit" variant="default">
                            Search
                        </Button>
                    </form>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-8">
                    {/* Type filters - inline buttons */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {typeFilters.map((filter) => {
                            const Icon = filter.icon;
                            const isActive = (searchParams.type || 'all') === filter.value;
                            return (
                                <Button
                                    key={filter.value}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleFilterChange('type', filter.value)}
                                    className={cn(
                                        "rounded-full flex items-center gap-2 transition-all",
                                        isActive
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-muted/50 border-muted hover:bg-muted"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {filter.label}
                                </Button>
                            );
                        })}
                    </div>

                    {/* More filters */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-full gap-2">
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

                {/* Results */}
                {initialPosts.length === 0 ? (
                    <div className="text-center py-20">
                        <Compass className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
                        <p className="text-muted-foreground mb-6">
                            Try adjusting your search or filters to find what you're looking for.
                        </p>
                        <Button onClick={() => navigateWithTransition('/explore')}>
                            Clear Filters
                        </Button>
                    </div>
                ) : (
                    <>
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
                                            className="gap-1"
                                        >
                                            Previous
                                        </Button>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <span className="px-4 py-2 text-sm">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPage >= totalPages}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            className="gap-1"
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

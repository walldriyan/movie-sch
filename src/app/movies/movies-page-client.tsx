'use client';

import { useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Film, Loader2, SlidersHorizontal } from 'lucide-react';
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

export default function MoviesPageClient({
    initialPosts,
    totalPages,
    currentPage,
    searchParams
}: MoviesPageClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

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

    return (
        <div className={cn(
            "min-h-screen bg-background transition-opacity duration-200 overflow-x-hidden",
            isPending && "opacity-60 pointer-events-none"
        )}>
            {/* Centered content container */}
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <Film className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">Movies</h1>
                        {isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </div>

                    {/* Quick filters */}
                    <div className="flex items-center gap-2">
                        <Select
                            value={searchParams.genre || 'all'}
                            onValueChange={(value) => handleFilterChange('genre', value)}
                        >
                            <SelectTrigger className="w-[140px] bg-muted/50">
                                <SelectValue placeholder="Genre" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Genres</SelectItem>
                                {GENRES.map((genre) => (
                                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={searchParams.year || 'all'}
                            onValueChange={(value) => handleFilterChange('year', value)}
                        >
                            <SelectTrigger className="w-[120px] bg-muted/50">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                {YEARS.map((year) => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(searchParams.genre || searchParams.year) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigateWithTransition('/movies')}
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Results */}
                {initialPosts.length === 0 ? (
                    <div className="text-center py-20">
                        <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-semibold mb-2">No Movies Found</h2>
                        <p className="text-muted-foreground mb-6">
                            Try adjusting your filters to find what you're looking for.
                        </p>
                        <Button onClick={() => navigateWithTransition('/movies')}>
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

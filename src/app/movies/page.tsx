import { Suspense } from 'react';
import { getPosts } from '@/lib/actions/posts';
import MoviesPageClient from './movies-page-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Posts | Fiddle',
    description: 'Browse and discover the best content on Fiddle.',
};

export const dynamic = 'force-dynamic';

interface MoviesPageProps {
    searchParams: Promise<{
        genre?: string;
        year?: string;
        sort?: string;
        page?: string;
    }>;
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const genre = params.genre;
    const year = params.year;
    const sort = params.sort || 'updatedAt-desc';

    const filters: any = { type: 'MOVIE' };
    if (genre) filters.genres = { has: genre };
    if (year) filters.year = parseInt(year);

    const { posts, totalPages } = await getPosts({
        page,
        limit: 24,
        filters
    });

    return (
        <Suspense fallback={<MoviesSkeleton />}>
            <MoviesPageClient
                initialPosts={posts}
                totalPages={totalPages}
                currentPage={page}
                searchParams={params}
            />
        </Suspense>
    );
}

function MoviesSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="h-10 w-40 bg-muted animate-pulse rounded mb-8" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(18)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
                            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

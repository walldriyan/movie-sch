import { Suspense } from 'react';
import { getPosts } from '@/lib/actions/posts';
import ExplorePageClient from './explore-page-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Explore | Fiddle',
    description: 'Discover trending content, articles, and more on Fiddle.',
};

export const dynamic = 'force-dynamic';

interface ExplorePageProps {
    searchParams: Promise<{
        q?: string;
        type?: string;
        genre?: string;
        year?: string;
        page?: string;
    }>;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const type = params.type;
    const genre = params.genre;
    const year = params.year;
    const query = params.q;

    const filters: any = {};
    if (type) filters.type = type;
    if (genre) filters.genres = { has: genre };
    if (year) filters.year = parseInt(year);

    const { posts, totalPages } = await getPosts({
        page,
        limit: 24,
        filters
    });

    return (
        <Suspense fallback={<ExploreSkeleton />}>
            <ExplorePageClient
                initialPosts={posts}
                totalPages={totalPages}
                currentPage={page}
                searchParams={params}
            />
        </Suspense>
    );
}

function ExploreSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="h-10 w-48 bg-muted animate-pulse rounded mb-8" />
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

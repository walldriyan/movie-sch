'use server';

import { getPosts } from '@/lib/actions/posts/read';
import SeriesPageClient from './series-page-client';

interface SeriesPageProps {
    searchParams: Promise<{
        genre?: string;
        year?: string;
        sort?: string;
        page?: string;
    }>;
}

export const metadata = {
    title: 'TV Series | Fiddle',
    description: 'Browse and discover TV series on Fiddle.',
};

export default async function SeriesPage({ searchParams }: SeriesPageProps) {
    const params = await searchParams;
    const page = parseInt(params.page || '1', 10);
    const genre = params.genre;
    const year = params.year;
    const sort = params.sort || 'updatedAt-desc';

    // Build filters for TV Series only
    const filters: any = {
        type: 'TV_SERIES',
        sortBy: sort,
    };

    if (genre) {
        filters.genres = [genre];
    }

    if (year) {
        filters.yearRange = [parseInt(year, 10), parseInt(year, 10)];
    }

    const { posts, totalPages } = await getPosts({
        page,
        limit: 12,
        filters
    });

    return (
        <SeriesPageClient
            initialPosts={posts}
            totalPages={totalPages}
            currentPage={page}
            searchParams={params}
        />
    );
}

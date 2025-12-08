import { Suspense } from 'react';
import { getPosts } from '@/lib/actions';
import { getNotifications } from '@/lib/actions/notifications';
import { getExamsForUser } from '@/lib/actions/exams';
import { getPublicGroups } from '@/lib/actions/groups';
import { auth } from '@/auth';
import SearchPageClient from '@/components/search-page-client';
import { Loader2 } from 'lucide-react';

interface SearchPageProps {
    searchParams: Promise<{
        q?: string;
        type?: string;
        timeFilter?: string;
        sortBy?: string;
        page?: string;
    }>;
}

export const metadata = {
    title: 'Search & Explore | Fiddle',
    description: 'Search and discover movies, series, and educational content on Fiddle.',
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const query = params.q || '';
    const type = params.type;
    const timeFilter = params.timeFilter || 'all';
    const sortBy = params.sortBy || 'updatedAt-desc';
    const page = parseInt(params.page || '1', 10);

    // Get current user session
    const session = await auth();
    const userId = session?.user?.id;

    // Fetch posts with filters
    const filters: any = {};
    if (query) {
        filters.search = query;
    }
    if (type) {
        filters.type = type;
    }
    if (timeFilter && timeFilter !== 'all') {
        filters.timeFilter = timeFilter;
    }
    filters.sortBy = sortBy;

    // Main posts query
    const { posts: rawPosts, totalPages } = await getPosts({
        page,
        limit: 10,
        filters
    });

    // Explore data - fetch only when no search query (default explore view)
    let trendingPosts: any[] = [];
    let newReleases: any[] = [];
    let topRatedPosts: any[] = [];
    let allGenres: string[] = [];

    if (!query && page === 1) {
        try {
            const [trendingResult, newReleasesResult, topRatedResult] = await Promise.allSettled([
                // Trending - most viewed
                getPosts({ page: 1, limit: 6, filters: { sortBy: 'viewCount-desc' } }),
                // New Releases - latest published
                getPosts({ page: 1, limit: 6, filters: { sortBy: 'publishedAt-desc' } }),
                // Top Rated - highest IMDB rating
                getPosts({ page: 1, limit: 6, filters: { sortBy: 'imdbRating-desc' } }),
            ]);

            if (trendingResult.status === 'fulfilled') {
                trendingPosts = trendingResult.value.posts || [];
            }
            if (newReleasesResult.status === 'fulfilled') {
                newReleases = newReleasesResult.value.posts || [];
            }
            if (topRatedResult.status === 'fulfilled') {
                topRatedPosts = topRatedResult.value.posts || [];
            }

            // Extract unique genres from all posts
            const allPosts = [...rawPosts, ...trendingPosts, ...newReleases, ...topRatedPosts];
            const genreSet = new Set<string>();
            allPosts.forEach(post => {
                const genres = Array.isArray(post.genres)
                    ? post.genres
                    : typeof post.genres === 'string'
                        ? post.genres.split(',').map((g: string) => g.trim()).filter(Boolean)
                        : [];
                genres.forEach((g: string) => genreSet.add(g));
            });
            allGenres = Array.from(genreSet).slice(0, 12);
        } catch (error) {
            console.error('Error fetching explore data:', error);
        }
    }

    // Fetch user-specific data in parallel
    let userNotifications: any[] = [];
    let userExams: any[] = [];
    let userGroups: any[] = [];

    if (userId) {
        try {
            const [notifResult, examsResult, groupsResult] = await Promise.allSettled([
                getNotifications({ page: 1, limit: 5 }),
                getExamsForUser(userId),
                getPublicGroups(5),
            ]);

            if (notifResult.status === 'fulfilled') {
                userNotifications = notifResult.value.items || [];
            }
            if (examsResult.status === 'fulfilled') {
                userExams = examsResult.value || [];
            }
            if (groupsResult.status === 'fulfilled') {
                userGroups = groupsResult.value || [];
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    // Process posts to ensure genres is always an array
    const posts = rawPosts.map(post => ({
        ...post,
        genres: Array.isArray(post.genres)
            ? post.genres
            : typeof post.genres === 'string'
                ? post.genres.split(',').map((g: string) => g.trim()).filter(Boolean)
                : []
    }));

    // Get featured post (first post with image or first post)
    const featuredPost = posts.find(p => p.posterUrl) || posts[0] || null;
    const remainingPosts = featuredPost ? posts.filter(p => p.id !== featuredPost.id) : posts;

    return (
        <div className="min-h-screen">
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            }>
                <SearchPageClient
                    featuredPost={featuredPost as any}
                    initialPosts={remainingPosts as any[]}
                    query={query}
                    currentType={type}
                    currentTimeFilter={timeFilter}
                    currentSortBy={sortBy}
                    currentPage={page}
                    totalPages={totalPages}
                    userNotifications={userNotifications}
                    userExams={userExams}
                    userGroups={userGroups}
                    // Explore data
                    trendingPosts={trendingPosts as any[]}
                    newReleases={newReleases as any[]}
                    topRatedPosts={topRatedPosts as any[]}
                    allGenres={allGenres}
                />
            </Suspense>
        </div>
    );
}

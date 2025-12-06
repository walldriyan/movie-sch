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
    title: 'Search | Fiddle',
    description: 'Search and discover educational content, articles, and more on Fiddle.',
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

    const { posts: rawPosts, totalPages } = await getPosts({
        page,
        limit: 10,
        filters
    });

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
                />
            </Suspense>
        </div>
    );
}


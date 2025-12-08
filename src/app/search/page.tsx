import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPosts, getPost } from '@/lib/actions/posts/read';
import { getNotifications } from '@/lib/actions/notifications';
import { getExamsForUser } from '@/lib/actions/exams';
import { getPublicGroups } from '@/lib/actions/groups';
import { canUserDownloadSubtitle } from '@/lib/actions/subtitles';
import { auth } from '@/auth';
import SearchPageClient from '@/components/search-page-client';
import MoviePageContent from '@/components/movie/movie-page-content';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { Loader2 } from 'lucide-react';

interface SearchPageProps {
    searchParams: Promise<{
        q?: string;
        type?: string;
        timeFilter?: string;
        sortBy?: string;
        page?: string;
        movieId?: string; // Movie detail view
    }>;
}

export const metadata = {
    title: 'Search & Explore | Fiddle',
    description: 'Search and discover movies, series, and educational content on Fiddle.',
};

// Helper function to serialize dates safely
function serializeDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    if (typeof date === 'string') return date;
    if (date instanceof Date) return date.toISOString();
    return null;
}

// Helper to serialize user object
function serializeUser(user: any): any {
    if (!user) return null;
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        bio: user.bio || null,
        coverImage: user.coverImage || null,
        website: user.website || null,
        twitter: user.twitter || null,
        linkedin: user.linkedin || null,
        emailVerified: serializeDate(user.emailVerified),
        createdAt: serializeDate(user.createdAt),
        updatedAt: serializeDate(user.updatedAt),
        permissions: user.permissions,
    };
}

// Helper to serialize review recursively
function serializeReview(review: any): any {
    if (!review) return null;
    return {
        id: review.id,
        comment: review.comment,
        rating: review.rating,
        userId: review.userId,
        postId: review.postId,
        parentId: review.parentId,
        createdAt: serializeDate(review.createdAt),
        updatedAt: serializeDate(review.updatedAt),
        user: serializeUser(review.user),
        replies: (review.replies || []).map(serializeReview).filter(Boolean),
    };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const movieId = params.movieId;
    const query = params.q || '';
    const type = params.type;
    const timeFilter = params.timeFilter || 'all';
    const sortBy = params.sortBy || 'updatedAt-desc';
    const page = parseInt(params.page || '1', 10);

    // Get current user session
    const session = await auth();
    const userId = session?.user?.id;

    // ===== MOVIE DETAIL VIEW =====
    if (movieId) {
        const postId = Number(movieId);
        if (isNaN(postId)) notFound();

        const postData = await getPost(postId);
        if (!postData) notFound();

        // Server-Side Lock Logic
        let isContentLocked = false;
        const user = session?.user;

        if (user && (user.role === ROLES.SUPER_ADMIN || user.id === postData.authorId)) {
            isContentLocked = false;
        } else if (postData.visibility === 'GROUP_ONLY') {
            if (!user) {
                isContentLocked = true;
            } else {
                const membership = await prisma.groupMember.findFirst({
                    where: { groupId: postData.groupId || undefined, userId: user.id, status: 'ACTIVE' }
                });
                if (!membership) isContentLocked = true;
            }
        } else if (postData.isLockedByDefault) {
            isContentLocked = true;
        }

        // Serialize subtitles with permissions
        const subtitlesWithPermissions = await Promise.all(
            (postData.subtitles || []).map(async (subtitle: any) => ({
                id: subtitle.id,
                language: subtitle.language,
                url: subtitle.url,
                uploaderName: subtitle.uploaderName,
                postId: subtitle.postId,
                userId: subtitle.userId,
                createdAt: serializeDate(subtitle.createdAt),
                updatedAt: serializeDate(subtitle.updatedAt),
                canDownload: await canUserDownloadSubtitle(subtitle.id),
            }))
        );

        // Serialize post for client
        const serializablePostForClient = {
            id: postData.id,
            title: postData.title,
            description: postData.description,
            posterUrl: postData.posterUrl,
            type: postData.type,
            genres: postData.genres || [],
            year: postData.year,
            duration: postData.duration,
            directors: postData.directors,
            mainCast: postData.mainCast,
            imdbRating: postData.imdbRating,
            rottenTomatoesRating: postData.rottenTomatoesRating,
            googleRating: postData.googleRating,
            viewCount: postData.viewCount || 0,
            status: postData.status,
            visibility: postData.visibility,
            seriesId: postData.seriesId,
            orderInSeries: postData.orderInSeries,
            authorId: postData.authorId,
            groupId: postData.groupId,
            isContentLocked,
            author: serializeUser(postData.author),
            reviews: (postData.reviews || []).map(serializeReview).filter(Boolean),
            series: postData.series ? { id: postData.series.id, title: postData.series.title } : null,
            exam: postData.exam ? { id: postData.exam.id, title: postData.exam.title, description: postData.exam.description } : null,
            mediaLinks: (postData.mediaLinks || []).map((link: any) => ({ id: link.id, url: link.url, type: link.type })),
            _count: postData._count,
            likedBy: (postData.likedBy || []).map(serializeUser),
            dislikedBy: (postData.dislikedBy || []).map(serializeUser),
            favoritePosts: (postData.favoritePosts || []).map((fp: any) => ({
                userId: fp.userId,
                postId: fp.postId,
                createdAt: serializeDate(fp.createdAt),
            })),
        };

        return (
            <MoviePageContent
                initialPost={serializablePostForClient}
                initialSubtitles={subtitlesWithPermissions}
                session={session}
            />
        );
    }

    // ===== SEARCH/EXPLORE VIEW =====

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

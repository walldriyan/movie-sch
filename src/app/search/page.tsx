import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getAdsConfig } from '@/lib/actions/ads';
import { getPosts, getPost, getFavoritePostsByUserId } from '@/lib/actions/posts/read';
import Link from 'next/link';
import { getSeriesByAuthorId, getSeriesById, getPostsBySeriesId } from '@/lib/actions/series';
import { getNotifications } from '@/lib/actions/notifications';
import { getExamForTaker, getExamResults, getExamsForUser } from '@/lib/actions/exams';
import { getPublicGroups } from '@/lib/actions/groups';
import { canUserDownloadSubtitle } from '@/lib/actions/subtitles';
import { getUsers } from '@/lib/actions/users';
import { auth } from '@/auth';
import SearchPageClient from '@/components/search-page-client';
import UnifiedWatchPage from '@/components/common/unified-watch-page';
import ExamTaker from '@/components/exam-taker';
import ProfileHeader from '@/components/profile/profile-header';
import ProfilePostList from '@/components/profile/profile-post-list';
import ProfileSeriesList from '@/components/profile/profile-series-list';
import ProfileExamList from '@/components/profile/profile-exam-list';
import ProfileAdsList from '@/components/profile/profile-ads-list';
import ProfileMessages from '@/components/profile/profile-messages';
import ProfileAbout from '@/components/profile/profile-about';
import PublicAdList from '@/components/profile/public-ad-list';
import PublicAdView from '@/components/profile/public-ad-view';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ProfilePaymentManager from '@/components/profile/profile-payment-manager';
import { getSubscriptionPlans, getUserPaymentHistory, getUserActiveSubscription } from '@/lib/actions/payment-actions';
import type { User as PrismaUser } from '@prisma/client';

interface SearchPageProps {
    searchParams: Promise<{
        q?: string;
        type?: string;
        timeFilter?: string;
        sortBy?: string;
        page?: string;
        movieId?: string;
        seriesId?: string;
        post?: string; // For episode ID in series
        examId?: string;
        profileId?: string;
        filter?: string;
        view?: string;
        submissionId?: string;
        adId?: string; // For sponsored ad redirect
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
// Get user stats for profile
async function getUserStats(userId: string) {
    const [postsCount, favoritesCount] = await Promise.all([
        prisma.post.count({ where: { authorId: userId } }),
        prisma.favoritePost.count({ where: { userId: userId } }),
    ]);
    return { postsCount, favoritesCount, followersCount: 0, followingCount: 0 };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const params = await searchParams;
    const movieId = params.movieId;
    const seriesId = params.seriesId;
    const postParam = params.post;
    const examId = params.examId;
    const profileId = params.profileId;
    const query = params.q || '';
    const type = params.type;
    const timeFilter = params.timeFilter || 'all';
    const sortBy = params.sortBy || 'updatedAt-desc';
    const page = parseInt(params.page || '1', 10);
    const profileFilter = params.filter || 'posts';
    const examView = params.view;
    const submissionIdParam = params.submissionId;

    // NOTE: ad_view filter is now handled in PROFILE VIEW section below
    // Removed redirect as it was causing issues

    // Fetch Global Ad Config
    const ads = await getAdsConfig();
    const activeAd = ads.find(a => a.active);
    const adConfig = activeAd ? {
        imageUrl: activeAd.imageUrl,
        linkUrl: activeAd.linkUrl,
        enabled: true
    } : {
        imageUrl: '',
        linkUrl: '',
        enabled: false
    };

    // Get current user session
    const session = await auth();
    const userId = session?.user?.id;

    // ===== EXAM VIEW =====
    if (examId) {
        if (!session?.user) return notFound();

        const examIdNum = parseInt(examId, 10);
        if (isNaN(examIdNum)) return notFound();

        // Check if viewing results
        if (examView === 'results' && submissionIdParam) {
            const submissionId = parseInt(submissionIdParam, 10);
            if (isNaN(submissionId)) return notFound();

            try {
                const { submission, submissionCount } = await getExamResults(submissionId);
                if (submission.examId !== examIdNum) return notFound();

                const totalPoints = submission.exam.questions.reduce((sum: number, q: any) => sum + q.points, 0);
                const percentage = totalPoints > 0 ? (submission.score / totalPoints) * 100 : 0;

                return (
                    <div className="min-h-screen bg-background py-8 px-4 pt-24">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <h1 className="font-semibold text-2xl">{submission.exam.title}</h1>
                            <div className="text-4xl font-bold">{submission.score}/{totalPoints} ({percentage.toFixed(0)}%)</div>
                        </div>
                    </div>
                );
            } catch (error) {
                return (
                    <div className="flex items-center justify-center min-h-screen">
                        <Alert variant="destructive" className="max-w-lg">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>Could not load results</AlertDescription>
                        </Alert>
                    </div>
                );
            }
        }

        // Show exam taker
        try {
            const exam = await getExamForTaker(examIdNum);
            if (!exam) return notFound();
            return <ExamTaker exam={exam} />;
        } catch (error) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <Alert variant="destructive" className="max-w-lg">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Access Denied</AlertTitle>
                        <AlertDescription>You cannot access this exam</AlertDescription>
                    </Alert>
                </div>
            );
        }
    }

    // ===== PROFILE VIEW =====
    if (profileId) {
        const rawProfileUser = await prisma.user.findUnique({
            where: { id: profileId }
        });

        if (!rawProfileUser) return notFound();

        // Serialize dates to strings (Client Component compatibility)
        const profileUser = {
            ...rawProfileUser,
            createdAt: rawProfileUser.createdAt.toISOString(),
            updatedAt: rawProfileUser.updatedAt.toISOString(),
            emailVerified: rawProfileUser.emailVerified ? rawProfileUser.emailVerified.toISOString() : null,
            subscriptionEndDate: rawProfileUser.subscriptionEndDate ? rawProfileUser.subscriptionEndDate.toISOString() : null,
        } as unknown as PrismaUser;

        const isOwnProfile = session?.user?.id === profileUser.id;

        // Fetch subscription for badge display
        const profileSub = await prisma.userSubscription.findFirst({
            where: {
                userId: profileUser.id,
                status: 'ACTIVE',
                endDate: { gt: new Date() }
            },
            include: { plan: true },
            orderBy: { endDate: 'desc' }
        });

        // Determine badge label
        // Determine badge label
        let planLabel = 'FREE'; // Default to FREE

        if (profileUser.role === 'SUPER_ADMIN') {
            planLabel = 'ADMIN';
        } else if ((profileSub as any)?.plan?.name) {
            planLabel = (profileSub as any).plan.name; // e.g. "Pro Weekly" or "Gold"
            // Simplify if needed, e.g. just "PRO" if checks out
            if (planLabel.toLowerCase().includes('pro')) planLabel = 'PRO';
            else if (planLabel.toLowerCase().includes('premium')) planLabel = 'PRO';
        }

        const stats = await getUserStats(profileUser.id);


        let displayPosts: any[] = [];
        let displaySeries: any[] = [];
        let displayExams: any[] = [];
        let displayAds: any[] = [];
        let publicAds: any[] = [];
        let highlightedAd: any = null;
        let totalSeriesCount = 0;
        const adIdParam = params.adId;

        if (profileFilter === 'posts') {
            const { posts } = await getPosts({ filters: { authorId: profileUser.id, includePrivate: isOwnProfile } });
            displayPosts = posts || [];
        } else if (profileFilter === 'favorites') {
            displayPosts = await getFavoritePostsByUserId(profileUser.id) || [];
        } else if (profileFilter === 'series') {
            const { series, totalSeries } = await getSeriesByAuthorId(profileUser.id, 10);
            displaySeries = series || [];
            totalSeriesCount = totalSeries;
        } else if (profileFilter === 'exams') {
            if (isOwnProfile || session?.user?.role === ROLES.SUPER_ADMIN) {
                displayExams = await getExamsForUser(profileUser.id);
            }
        } else if (profileFilter === 'ads') {
            if (isOwnProfile || session?.user?.role === ROLES.SUPER_ADMIN) {
                displayAds = await prisma.sponsoredPost.findMany({
                    where: { userId: profileUser.id },
                    orderBy: { createdAt: 'desc' },
                    include: { paymentRecord: true }
                });
            }
        } else if (profileFilter === 'ad_view') {
            // Public view of active sponsored ads
            let specificAd = null;
            if (adIdParam) {
                specificAd = await prisma.sponsoredPost.findUnique({
                    where: { id: adIdParam }
                });
            }
            const activeAdsRaw = await prisma.sponsoredPost.findMany({
                where: {
                    userId: profileUser.id,
                    status: 'APPROVED',
                    isActive: true,
                    ...(specificAd ? { id: { not: specificAd.id } } : {})
                },
                orderBy: { createdAt: 'desc' }
            });

            highlightedAd = specificAd;
            publicAds = activeAdsRaw;
        } else if (profileFilter === 'payments' && isOwnProfile) {
            // Fetch Payment Data
            const [plans, paymentHistory, activeSub] = await Promise.all([
                getSubscriptionPlans(),
                getUserPaymentHistory(),
                getUserActiveSubscription()
            ]);

            // We can reuse a variable or create a new one to hold this data to pass to the client
            // Since the rendered component below is inside a conditional, we will handle the render there.
            // Just assigning to a scope variable or passing directly.
            // Let's attach to a variable `paymentData`
            (global as any).paymentData = { plans, paymentHistory, activeSub };
        }

        return (
            <div className="min-h-screen bg-background">
                <ProfileHeader user={profileUser} currentFilter={profileFilter} isOwnProfile={isOwnProfile} stats={stats} planLabel={planLabel} />
                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-3">
                            <div key={profileFilter} className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                {profileFilter === 'series' ? (
                                    <ProfileSeriesList series={displaySeries} isOwnProfile={isOwnProfile} profileUser={profileUser} totalSeries={totalSeriesCount} />
                                ) : profileFilter === 'exams' ? (
                                    <ProfileExamList exams={displayExams} isOwnProfile={isOwnProfile} />
                                ) : profileFilter === 'ads' ? (
                                    <ProfileAdsList ads={displayAds} isOwnProfile={isOwnProfile} />
                                ) : profileFilter === 'ad_view' ? (
                                    <div className="space-y-12">
                                        {highlightedAd && (
                                            <div className="animate-in slide-in-from-top-4 duration-500">
                                                <PublicAdView
                                                    ad={highlightedAd}
                                                    canViewStats={isOwnProfile || session?.user?.role === ROLES.SUPER_ADMIN}
                                                />
                                                <div className="my-8 border-b border-white/5" />
                                                <h3 className="text-xl font-bold text-white mb-6 px-4">More from this Creator</h3>
                                            </div>
                                        )}
                                        <PublicAdList ads={publicAds} highlightId={adIdParam} />
                                    </div>
                                ) : profileFilter === 'messages' && isOwnProfile ? (
                                    <ProfileMessages user={profileUser} />
                                ) : profileFilter === 'payments' && isOwnProfile ? (
                                    <ProfilePaymentManager
                                        plans={(global as any).paymentData?.plans || []}
                                        history={(global as any).paymentData?.paymentHistory || []}
                                        currentSubscription={(global as any).paymentData?.activeSub}
                                    />
                                ) : profileFilter === 'about' ? (
                                    <ProfileAbout profileUser={profileUser} loggedInUser={session?.user} />
                                ) : (
                                    <ProfilePostList posts={displayPosts} isOwnProfile={isOwnProfile} currentFilter={profileFilter} profileUser={profileUser} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );

    }

    // ===== SERIES WATCH PAGE =====
    if (seriesId) {
        const id = parseInt(seriesId, 10);
        if (isNaN(id)) return notFound();

        const [series, allPosts] = await Promise.all([
            getSeriesById(id),
            getPostsBySeriesId(id),
        ]);

        if (!series) return notFound();

        // Determine active post (episode)
        let activePost = allPosts[0];
        if (postParam) {
            const pid = parseInt(postParam, 10);
            if (!isNaN(pid)) {
                const found = allPosts.find(p => p.id === pid);
                if (found) activePost = found;
            }
        }

        if (!activePost) {
            // Series empty? Handle gracefully
            return (
                <div className="min-h-screen pt-24 text-center">
                    <p>No episodes available.</p>
                </div>
            )
        }

        // Check content lock for Active Post
        // (Reusing similar logic to Movie, can be refactored to shared function later)
        let isContentLocked = false;
        const user = session?.user;
        const postData = await getPost(activePost.id) as any; // Re-fetch full post data including author/relations
        // Note: getPostsBySeriesId usually returns lighter objects, but getPost returns full details including subtitles/mediaLinks

        if (!postData) return notFound();

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

        // Serialize subtitles - check permission once instead of N times
        const canDownloadSubtitles = !!session?.user; // Simple auth check - no need for N queries
        const subtitlesWithPermissions = (postData.subtitles || []).map((subtitle: any) => ({
            id: subtitle.id,
            language: subtitle.language,
            url: subtitle.url,
            uploaderName: subtitle.uploaderName,
            postId: subtitle.postId,
            userId: subtitle.userId,
            createdAt: serializeDate(subtitle.createdAt),
            updatedAt: serializeDate(subtitle.updatedAt),
            canDownload: canDownloadSubtitles, // Apply once to all
        }));

        // Serialize Series
        const serializedSeries = {
            ...series,
            createdAt: serializeDate(series.createdAt),
            updatedAt: serializeDate(series.updatedAt),
        };

        // Serialize Active Post (Detailed)
        // Similar to Movie serialization logic
        const serializedActivePost = {
            id: postData.id,
            title: postData.title,
            description: postData.description,
            posterUrl: postData.posterUrl,
            type: postData.type,
            genres: postData.genres || [],
            year: postData.year,
            duration: postData.duration,
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

        // Serialize All Posts (List for sidebar)
        const serializedAllPosts = allPosts.map(p => ({
            ...p,
            createdAt: serializeDate(p.createdAt),
            updatedAt: serializeDate(p.updatedAt),
            publishedAt: serializeDate(p.publishedAt),
            // We might need 'isLocked' status for list items too, but that requires complex checking for EACH episode.
            // For now, let's assume sidebar list items show lock only if we have that data readily.
            // getPostsBySeriesId might include enough info?
            // If performance allows, ideally we check lock for all, but for speed, maybe skip or implement simpler check.
            isLocked: p.visibility === 'GROUP_ONLY' || p.isLockedByDefault
        }));

        return (
            <UnifiedWatchPage
                type="SERIES"
                post={serializedActivePost}
                series={serializedSeries as any}
                allPosts={serializedAllPosts}
                formattedSubtitles={subtitlesWithPermissions}
                session={session}
                adConfig={ads}
            />
        );
    }


    // ===== MOVIE DETAIL VIEW =====
    if (movieId) {
        const postId = Number(movieId);
        if (isNaN(postId)) notFound();

        const postData = await getPost(postId) as any;
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

        // Serialize subtitles - check permission once instead of N times
        const movieCanDownload = !!session?.user; // Simple auth check - no need for N queries
        const subtitlesWithPermissions = (postData.subtitles || []).map((subtitle: any) => ({
            id: subtitle.id,
            language: subtitle.language,
            url: subtitle.url,
            uploaderName: subtitle.uploaderName,
            postId: subtitle.postId,
            userId: subtitle.userId,
            createdAt: serializeDate(subtitle.createdAt),
            updatedAt: serializeDate(subtitle.updatedAt),
            canDownload: movieCanDownload, // Apply once to all
        }));

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

        // Fetch related posts for sidebar (e.g. Trending of same type)
        const { posts: relatedRaw } = await getPosts({
            page: 1,
            limit: 10,
            filters: { type: postData.type || 'MOVIE', sortBy: 'viewCount-desc' }
        });

        // Serialize related posts
        const relatedPosts = relatedRaw.filter(p => p.id !== postData.id).map(p => ({
            ...p,
            createdAt: serializeDate(p.createdAt),
            updatedAt: serializeDate(p.updatedAt),
            publishedAt: serializeDate(p.publishedAt),
            genres: Array.isArray(p.genres) ? p.genres : (typeof p.genres === 'string' ? p.genres.split(',') : []),
        }));

        // Check if this post belongs to a Series
        if (postData.seriesId) {
            // It's an episode! Fetch series context to show Episode List in sidebar
            const [series, allSeriesPosts] = await Promise.all([
                getSeriesById(postData.seriesId),
                getPostsBySeriesId(postData.seriesId),
            ]);

            if (series) {
                // Serialize Series
                const serializedSeries = {
                    ...series,
                    createdAt: serializeDate(series.createdAt),
                    updatedAt: serializeDate(series.updatedAt),
                };

                // Serialize All Posts (Episodes) & Check Locks
                // Optimization: We know current user's groups if we fetched them? 
                // For now, simple check: If user is admin/author -> Unlocked.
                // If visibility GROUP_ONLY -> Locked (client visual only, true check on click).
                const serializedAllPosts = allSeriesPosts.map(p => {
                    let isLocked = false;
                    if (p.visibility === 'GROUP_ONLY') {
                        // Ideally we check group membership here, but for list view, 
                        // we can show lock if not admin/author.
                        if (!user || (user.role !== ROLES.SUPER_ADMIN && user.id !== p.authorId)) {
                            isLocked = true;
                        }
                    } else if (p.isLockedByDefault) {
                        isLocked = true;
                    }

                    return {
                        ...p,
                        createdAt: serializeDate(p.createdAt),
                        updatedAt: serializeDate(p.updatedAt),
                        publishedAt: serializeDate(p.publishedAt),
                        isLocked
                    };
                });

                return (
                    <UnifiedWatchPage
                        type="SERIES"
                        post={serializablePostForClient}
                        series={serializedSeries as any}
                        allPosts={serializedAllPosts}
                        formattedSubtitles={subtitlesWithPermissions}
                        session={session}
                        adConfig={ads}
                    />
                );
            }
        }

        // It's a Standalone Movie -> Proceed with Related Posts
        return (
            <UnifiedWatchPage
                type="MOVIE"
                post={serializablePostForClient}
                relatedPosts={relatedPosts}
                formattedSubtitles={subtitlesWithPermissions}
                session={session}
                adConfig={ads}
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

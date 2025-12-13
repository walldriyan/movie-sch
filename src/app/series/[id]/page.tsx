import { notFound } from 'next/navigation';
import { getSeriesById, getPostsBySeriesId } from '@/lib/actions/series';
import { getPost } from '@/lib/actions/posts/read';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import SeriesWatchPage from '../../../components/series/series-watch-page';
import { ROLES } from '@/lib/permissions';

interface SeriesDetailPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ post?: string }>;
}

export async function generateMetadata({ params }: SeriesDetailPageProps) {
    const { id } = await params;
    const seriesId = parseInt(id, 10);
    if (isNaN(seriesId)) return { title: 'Series' };
    const series = await getSeriesById(seriesId);
    return {
        title: series ? `${series.title} | Fiddle` : 'Series Not Found',
    };
}

function serializeDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    if (typeof date === 'string') return date;
    return date.toISOString();
}

function serializeUser(user: any): any {
    if (!user) return null;
    return {
        ...user,
        emailVerified: serializeDate(user.emailVerified),
        createdAt: serializeDate(user.createdAt),
        updatedAt: serializeDate(user.updatedAt),
    };
}

function serializeReview(review: any): any {
    if (!review) return null;
    return {
        ...review,
        createdAt: serializeDate(review.createdAt),
        updatedAt: serializeDate(review.updatedAt),
        user: serializeUser(review.user),
        replies: (review.replies || []).map(serializeReview),
    };
}

export default async function SeriesDetailPage({ params, searchParams }: SeriesDetailPageProps) {
    const { id } = await params;
    const { post: postIdParam } = await searchParams;
    const seriesId = parseInt(id, 10);

    if (isNaN(seriesId)) notFound();

    const series = await getSeriesById(seriesId);
    if (!series) notFound();

    const allPosts = await getPostsBySeriesId(seriesId);

    if (allPosts.length === 0) {
        return (
            <div className="min-h-screen pt-24 px-8 text-center bg-background">
                <h1 className="text-2xl font-bold">{series.title}</h1>
                <p className="text-muted-foreground mt-4">No episodes available yet.</p>
            </div>
        );
    }

    let activePostId = allPosts[0].id;
    let initialActivePostId = activePostId;

    if (postIdParam) {
        const parsed = parseInt(postIdParam, 10);
        if (!isNaN(parsed)) activePostId = parsed;
    }

    const activePostData = await getPost(activePostId);
    if (!activePostData) notFound();

    const session = await auth();
    const user = session?.user;

    // Check Lock Active Post
    // Check Lock Active Post
    let isContentLocked = false;

    // 1. Admin/Author Override
    if (user && (user.role === ROLES.SUPER_ADMIN || user.id === activePostData.authorId)) {
        isContentLocked = false;
    } else {
        // 2. Default Lock Check
        if (activePostData.isLockedByDefault) isContentLocked = true;

        // 3. Group Lock Check
        if (activePostData.visibility === 'GROUP_ONLY') {
            if (!user) isContentLocked = true;
            else {
                const membership = await prisma.groupMember.findFirst({
                    where: { groupId: activePostData.groupId || undefined, userId: user.id, status: 'ACTIVE' }
                });
                if (!membership) isContentLocked = true;
            }
        }

        // 4. Premium Lock Check
        const isPremiumGroup = (activePostData as any).group?.isPremiumOnly;
        if (isPremiumGroup) {
            const hasPremiumAccess = user && (user.accountType === 'PREMIUM' || user.accountType === 'HYBRID');
            if (!hasPremiumAccess) isContentLocked = true;
        }
    }

    // Sidebar Locks
    let userGroupIds: string[] = [];
    if (user) {
        const memberships = await prisma.groupMember.findMany({
            where: { userId: user.id, status: 'ACTIVE' },
            select: { groupId: true }
        });
        userGroupIds = memberships.map(m => m.groupId);
    }

    const postsWithLockStatus = allPosts.map(post => {
        let isLocked = false;
        if (post.isLockedByDefault) isLocked = true;

        // Group only check
        if (post.visibility === 'GROUP_ONLY') {
            if (!user) isLocked = true;
            else if (post.groupId && !userGroupIds.includes(post.groupId)) isLocked = true;
        }

        // Premium check
        const isPremiumGroup = (post as any).group?.isPremiumOnly;
        if (isPremiumGroup) {
            const hasPremiumAccess = user && (user.accountType === 'PREMIUM' || user.accountType === 'HYBRID');
            if (!hasPremiumAccess) isLocked = true;
        }

        if (user && (user.role === ROLES.SUPER_ADMIN || user.id === post.authorId)) {
            isLocked = false;
        }

        return {
            ...post,
            isLocked,
            createdAt: serializeDate(post.createdAt),
            updatedAt: serializeDate(post.updatedAt),
            publishedAt: serializeDate(post.publishedAt),
            author: undefined,
            series: undefined
        };
    });

    const subtitles = ((activePostData as any).subtitles || []).map((s: any) => ({
        ...s,
        createdAt: serializeDate(s.createdAt),
        updatedAt: serializeDate(s.updatedAt),
        canDownload: true
    }));

    const activePostSerialized = {
        ...activePostData,
        createdAt: serializeDate(activePostData.createdAt),
        updatedAt: serializeDate(activePostData.updatedAt),
        publishedAt: serializeDate(activePostData.publishedAt),
        isContentLocked,
        author: serializeUser((activePostData as any).author),
        reviews: ((activePostData as any).reviews || []).map(serializeReview),
        likedBy: ((activePostData as any).likedBy || []).map(serializeUser),
        _count: (activePostData as any)._count,
    };

    return (
        <SeriesWatchPage
            series={{
                ...series,
                createdAt: serializeDate(series.createdAt),
                updatedAt: serializeDate(series.updatedAt),
            } as any}
            activePost={activePostSerialized as any}
            allPosts={postsWithLockStatus as any}
            session={session}
            formattedSubtitles={subtitles as any}
        />
    );
}

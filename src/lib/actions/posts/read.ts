
'use server';

import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { ROLES, MovieStatus } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { getUserGroupIds } from './utils';

// Helper function (not exported usually, but kept here for reuse if needed)
async function fetchPostsFromDB(options: { page?: number; limit?: number, filters?: any } = {}) {
    const { page = 1, limit = 10, filters = {} } = options;
    const skip = (page - 1) * limit;
    const session = await auth();
    const user = session?.user;
    const userRole = user?.role;

    let whereClause: Prisma.PostWhereInput = {};
    const { sortBy, genres, yearRange, ratingRange, timeFilter, authorId, includePrivate, type, lockStatus, search } = filters;


    if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.USER_ADMIN) {
        whereClause.status = { not: MovieStatus.PENDING_DELETION };
        if (lockStatus === 'locked') whereClause.isLockedByDefault = true;
        else if (lockStatus === 'unlocked') whereClause.isLockedByDefault = false;
    } else {
        whereClause.status = MovieStatus.PUBLISHED;
        const publicCriteria: Prisma.PostWhereInput = { visibility: 'PUBLIC' };
        if (lockStatus === 'locked') publicCriteria.isLockedByDefault = true;
        else publicCriteria.isLockedByDefault = false;

        if (user) {
            const userGroupIds = await getUserGroupIds(user.id);
            const groupCriteria: Prisma.PostWhereInput = { visibility: 'GROUP_ONLY', groupId: { in: userGroupIds } };
            if (lockStatus === 'locked') groupCriteria.isLockedByDefault = true;
            else groupCriteria.isLockedByDefault = false;
            whereClause.OR = [publicCriteria, groupCriteria];
        } else {
            whereClause = { ...whereClause, ...publicCriteria };
        }
    }

    // Common filters
    if (authorId) {
        whereClause.authorId = authorId;
        if (!includePrivate || (!userRole || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(userRole))) {
            whereClause.status = { in: [MovieStatus.PUBLISHED] };
        }
    }

    if (genres && genres.length > 0) {
        whereClause.OR = [...(whereClause.OR || []), ...genres.map((g: string) => ({ genres: { contains: g } }))];
    }

    if (yearRange) whereClause.year = { gte: yearRange[0], lte: yearRange[1] };
    if (ratingRange) whereClause.imdbRating = { gte: ratingRange[0], lte: ratingRange[1] };

    if (timeFilter && timeFilter !== 'all') {
        const now = new Date();
        if (timeFilter === 'today') whereClause.createdAt = { gte: startOfDay(now), lte: endOfDay(now) };
        else if (timeFilter === 'this_week') whereClause.createdAt = { gte: startOfWeek(now), lte: endOfWeek(now) };
        else if (timeFilter === 'this_month') whereClause.createdAt = { gte: startOfMonth(now), lte: endOfMonth(now) };
    }

    // Only apply type filter if it's a valid PostType enum value
    const validPostTypes = ['MOVIE', 'TV_SERIES', 'OTHER'];
    if (type && validPostTypes.includes(type.toUpperCase())) {
        whereClause.type = type.toUpperCase() as any;
    }

    if (search && search.trim()) {
        const term = search.trim().toLowerCase();
        const existing = { ...whereClause };
        whereClause = {
            AND: [
                existing,
                {
                    OR: [
                        { title: { contains: term } },
                        { description: { contains: term } },
                        { genres: { contains: term } }
                    ]
                }
            ]
        };
    }

    let orderBy: any = { updatedAt: 'desc' };
    if (sortBy) {
        const [field, dir] = sortBy.split('-');
        if (['updatedAt', 'imdbRating', 'createdAt'].includes(field)) orderBy = { [field]: dir };
    }

    const [posts, totalPosts] = await prisma.$transaction([
        prisma.post.findMany({
            where: whereClause, skip, take: limit, orderBy,
            include: {
                author: true,
                series: {
                    include: {
                        posts: { select: { posterUrl: true }, orderBy: { orderInSeries: 'asc' } },
                        _count: true
                    }
                },
                likedBy: { take: 5, select: { id: true, name: true, image: true } },
                _count: { select: { likedBy: true, reviews: true } }
            }
        }),
        prisma.post.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalPosts / limit);

    return {
        posts: (posts as any[]).map((p: any) => ({
            ...p,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            publishedAt: p.publishedAt?.toISOString() || null,
            author: { ...p.author, createdAt: p.author.createdAt.toISOString(), updatedAt: p.author.updatedAt.toISOString(), emailVerified: p.author.emailVerified?.toISOString() || null },
            series: p.series ? { ...p.series, createdAt: p.series.createdAt.toISOString(), updatedAt: p.series.updatedAt.toISOString(), posts: p.series.posts } : null
        })),
        totalPages, totalPosts
    };
}

export async function getPosts(options: { page?: number; limit?: number, filters?: any } = {}) {
    // Directly calling DB fetch, bypassing complex Redis logic for now as per request simplicity
    return await fetchPostsFromDB(options);
}

export async function getPost(postId: number) {
    const session = await auth();
    const userId = session?.user?.id;
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            reviews: { where: { parentId: null }, include: { user: true, replies: { include: { user: true }, orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' } },
            author: true, favoritePosts: userId ? { where: { userId } } : false, likedBy: true, dislikedBy: true, mediaLinks: true, series: true,
            exam: { where: { status: 'ACTIVE' }, select: { id: true, title: true, description: true } }, _count: true
        }
    });

    if (!post) return null;
    const subtitles = await prisma.subtitle.findMany({ where: { postId: postId } });

    return { ...post, genres: post.genres ? post.genres.split(',') : [], subtitles };
}

export async function getPostsForAdmin(options: any = {}) {
    const { page = 1, limit = 10, userId, userRole, status, sortBy = 'createdAt-desc' } = options;
    const skip = (page - 1) * limit;
    let whereClause: any = {};
    if (userRole === ROLES.USER_ADMIN) whereClause.authorId = userId;
    if (status) whereClause.status = status;

    const [field, dir] = sortBy.split('-');
    const orderBy = { [field]: dir };

    const [posts, totalPosts] = await prisma.$transaction([
        prisma.post.findMany({ where: whereClause, skip, take: limit, orderBy, include: { author: true, group: true, _count: true, series: true } }),
        prisma.post.count({ where: whereClause })
    ]);
    const totalPages = Math.ceil(totalPosts / limit);

    return {
        posts: posts.map(p => ({
            ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(), publishedAt: p.publishedAt?.toISOString() || null,
            author: { ...p.author, createdAt: p.author.createdAt.toISOString(), updatedAt: p.author.updatedAt.toISOString(), emailVerified: p.author.emailVerified?.toISOString() || null },
            series: p.series ? { ...p.series, createdAt: p.series.createdAt.toISOString(), updatedAt: p.series.updatedAt.toISOString() } : null
        })), totalPages, totalPosts
    };
}

export async function getFavoritePosts() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    const favs = await prisma.favoritePost.findMany({ where: { userId, post: { status: 'PUBLISHED' } }, include: { post: { include: { author: true, series: true, likedBy: true, _count: true } } }, orderBy: { createdAt: 'desc' } }) as any[];
    return favs.map((f: any) => ({ ...f.post, genres: f.post.genres ? f.post.genres.split(',') : [] }));
}

export async function getFavoritePostsByUserId(userId: string) {
    if (!userId) return [];
    const favs = await prisma.favoritePost.findMany({
        where: { userId, post: { status: 'PUBLISHED' } },
        include: { post: { include: { author: true, series: true, likedBy: true, _count: true } } },
        orderBy: { createdAt: 'desc' }
    }) as any[];
    return favs.map((f: any) => ({ ...f.post, genres: f.post.genres ? f.post.genres.split(',') : [] }));
}

export async function searchPostsForExam(query: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Not authenticated');
    return await prisma.post.findMany({ where: { title: { contains: query }, status: 'PUBLISHED' }, take: 10, orderBy: { createdAt: 'desc' }, include: { group: true } });
}

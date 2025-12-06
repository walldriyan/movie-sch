
'use server';

import { auth } from '@/auth';
import { ROLES, MovieStatus } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { subDays } from 'date-fns';
import type { PostFormData } from '@/lib/types';
import { saveImageFromDataUrl, deleteUploadedFile, invalidatePostsCache, extractAndUploadImages } from './utils';

export async function incrementViewCount(postId: number) {
    try {
        const updated = await prisma.post.update({ where: { id: postId }, data: { viewCount: { increment: 1 } } });
        return updated.viewCount;
    } catch (e) { throw e; }
}

export async function savePost(postData: PostFormData, id?: number) {
    console.log(`[Action: savePost] Starting save process. ID: ${id || 'new'}`);
    const session = await auth();
    if (!session?.user?.id) throw new Error('User not authenticated');
    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    if (!id && user.dailyPostLimit && user.dailyPostLimit > 0) {
        const count = await prisma.post.count({ where: { authorId: userId, createdAt: { gte: subDays(new Date(), 1) } } });
        if (count >= user.dailyPostLimit) throw new Error(`Daily limit reached.`);
    }

    // --- IMAGES PROCESSING START ---

    // 1. Process Poster (Cover Image)
    let finalPosterUrl = postData.posterUrl;
    if (postData.posterUrl && postData.posterUrl.startsWith('data:image')) {
        console.log('[Action: savePost] Saving new poster image from data URL to Supabase...');
        finalPosterUrl = await saveImageFromDataUrl(postData.posterUrl, 'posts');
        console.log('[Action: savePost] Poster Upload Complete. New URL:', finalPosterUrl);
    }

    // 2. Process Description (Content Images)
    let processedDescription = postData.description;
    if (processedDescription) {
        console.log('[Action: savePost] Processing description for images...');
        processedDescription = await extractAndUploadImages(processedDescription, 'posts-content');
    }

    // --- IMAGES PROCESSING END ---
    console.log('[Action: savePost] Final URLs for DB - Poster:', finalPosterUrl);

    const data: any = {
        title: postData.title, description: processedDescription, posterUrl: finalPosterUrl, year: postData.year, duration: postData.duration,
        genres: postData.genres?.join(','), directors: postData.directors, mainCast: postData.mainCast, imdbRating: postData.imdbRating,
        rottenTomatoesRating: postData.rottenTomatoesRating, googleRating: postData.googleRating, viewCount: postData.viewCount,
        type: postData.type || 'MOVIE', seriesId: postData.seriesId, orderInSeries: postData.orderInSeries, updatedAt: new Date(),
        visibility: postData.visibility, groupId: postData.visibility === 'GROUP_ONLY' ? postData.groupId : null,
        isLockedByDefault: postData.isLockedByDefault, requiresExamToUnlock: postData.requiresExamToUnlock
    };

    if (id) {
        const existing = await prisma.post.findUnique({ where: { id } });
        if (finalPosterUrl && existing?.posterUrl && finalPosterUrl !== existing.posterUrl) await deleteUploadedFile(existing.posterUrl);
        await prisma.$transaction([
            prisma.mediaLink.deleteMany({ where: { postId: id } }),
            prisma.post.update({ where: { id }, data: { ...data, status: MovieStatus.PENDING_APPROVAL, mediaLinks: { create: postData.mediaLinks } } })
        ]);
    } else {
        await prisma.post.create({ data: { ...data, status: MovieStatus.PENDING_APPROVAL, authorId: userId, mediaLinks: { create: postData.mediaLinks } } });
    }
    revalidatePath('/'); revalidatePath('/manage');
}

export async function updatePostStatus(postId: number, status: string) {
    const session = await auth();
    if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) throw new Error('Not authorized');
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    if (session.user.role === ROLES.USER_ADMIN && post.authorId !== session.user.id) throw new Error('Not authorized');

    await prisma.post.update({ where: { id: postId }, data: { status } });
    await invalidatePostsCache(postId, post.seriesId || undefined, post.authorId);
}

export async function toggleLikePost(postId: number, like: boolean) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Not authenticated');
    const userId = session.user.id;
    const post = await prisma.post.findUnique({ where: { id: postId }, include: { likedBy: true, dislikedBy: true } });
    if (!post) throw new Error('Post not found');

    const isLiked = post.likedBy.some(u => u.id === userId);
    const isDisliked = post.dislikedBy.some(u => u.id === userId);

    if (like) {
        if (isLiked) await prisma.post.update({ where: { id: postId }, data: { likedBy: { disconnect: { id: userId } } } });
        else await prisma.post.update({ where: { id: postId }, data: { likedBy: { connect: { id: userId } }, dislikedBy: { disconnect: isDisliked ? { id: userId } : undefined } } });
    } else {
        if (isDisliked) await prisma.post.update({ where: { id: postId }, data: { dislikedBy: { disconnect: { id: userId } } } });
        else await prisma.post.update({ where: { id: postId }, data: { dislikedBy: { connect: { id: userId } }, likedBy: { disconnect: isLiked ? { id: userId } : undefined } } });
    }
    revalidatePath('/');
}

export async function toggleFavoritePost(postId: number) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const exists = await prisma.favoritePost.findUnique({ where: { userId_postId: { userId, postId } } });
    if (exists) await prisma.favoritePost.delete({ where: { userId_postId: { userId, postId } } });
    else await prisma.favoritePost.create({ data: { userId, postId } });
    await invalidatePostsCache(postId, undefined, userId);
}

export async function updatePostLockSettings(postId: number, isLockedByDefault: boolean, requiresExamToUnlock: boolean) {
    const session = await auth();
    const user = session?.user;
    if (!user) throw new Error("Not authenticated");
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error("Post not found");
    if (post.authorId !== user.id && ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) throw new Error("Not authorized");

    await prisma.post.update({ where: { id: postId }, data: { isLockedByDefault, requiresExamToUnlock } });
    await invalidatePostsCache(postId, post.seriesId || undefined, post.authorId);
    revalidatePath(`/manage`);
    if (post.seriesId) revalidatePath(`/series/${post.seriesId}`);
}


'use server';

import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { invalidatePostsCache, saveImageFromDataUrl, extractAndUploadImages } from './utils';

export async function createPost(formData: FormData) {
    try {
        const session = await auth();
        if (!session?.user) {
            return { error: 'Unauthorized' };
        }

        console.log('[CreatePost] Starting post creation...');
        const posterUrlRaw = formData.get('posterUrl') as string;

        const title = formData.get('title') as string;
        let description = formData.get('description') as string;

        // Process Description for Base64 Images
        if (description) {
            console.log('[CreatePost] Processing description for images...');
            description = await extractAndUploadImages(description, 'posts-content');
        }

        // IMAGE UPLOAD LOGIC (Poster)
        // We use a new variable 'finalPosterUrl' to be absolutely sure we don't save Base64
        let finalPosterUrl = null;

        if (posterUrlRaw && posterUrlRaw.startsWith('data:image')) {
            console.log('[CreatePost] Base64 poster detected. Uploading to Supabase...');
            finalPosterUrl = await saveImageFromDataUrl(posterUrlRaw, 'posts');
            console.log('[CreatePost] Upload Complete. New URL:', finalPosterUrl);
        } else if (posterUrlRaw && posterUrlRaw.startsWith('http')) {
            finalPosterUrl = posterUrlRaw;
        }

        const year = parseInt(formData.get('year') as string) || new Date().getFullYear();
        const duration = formData.get('duration') as string;
        const genres = formData.get('genres') as string;
        const type = formData.get('type') as 'MOVIE' | 'TV_SERIES' | 'OTHER' || 'MOVIE';
        const visibility = formData.get('visibility') as 'PUBLIC' | 'GROUP_ONLY' || 'PUBLIC';

        const groupIdRaw = formData.get('groupId');
        const groupId = (visibility === 'GROUP_ONLY' && groupIdRaw) ? parseInt(groupIdRaw as string) : null;
        const seriesIdRaw = formData.get('seriesId');
        const seriesId = seriesIdRaw ? parseInt(seriesIdRaw as string) : null;

        const imdbRating = formData.get('imdbRating') ? parseFloat(formData.get('imdbRating') as string) : undefined;
        const googleRating = formData.get('googleRating') ? parseFloat(formData.get('googleRating') as string) : undefined;
        const rottenTomatoesRating = formData.get('rottenTomatoesRating') ? parseFloat(formData.get('rottenTomatoesRating') as string) : undefined;

        console.log('[CreatePost] Final Data Verification - PosterUrl:', finalPosterUrl);

        const newPost = await prisma.post.create({
            data: {
                title,
                description,
                posterUrl: finalPosterUrl,
                year,
                duration,
                genres,
                type,
                visibility,
                groupId,
                status: ROLES.SUPER_ADMIN === session.user.role ? 'PUBLISHED' : 'PENDING_APPROVAL',
                authorId: session.user.id,
                imdbRating,
                googleRating,
                rottenTomatoesRating,
                seriesId: seriesId || null,
                isLockedByDefault: formData.get('isLockedByDefault') === 'true',
                requiresExamToUnlock: formData.get('requiresExamToUnlock') === 'true',
            },
        });

        console.log('[CreatePost] Post successfully created with ID:', newPost.id);

        await invalidatePostsCache(newPost.id, seriesId || undefined, session.user.id);
        revalidatePath('/manage');
        return { success: true, postId: newPost.id };

    } catch (error) {
        console.error('[CreatePost] Error creating post:', error);
        return { error: 'Failed to create post' };
    }
}

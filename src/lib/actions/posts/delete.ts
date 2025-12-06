
'use server';

import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { deleteUploadedFile, invalidatePostsCache } from './utils';

export async function deletePost(id: number) {
    const session = await auth();
    const user = session?.user;
    if (!user) throw new Error('Not authorized.');
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new Error('Post not found');

    if (user.role === ROLES.SUPER_ADMIN) {
        await prisma.$transaction([
            prisma.favoritePost.deleteMany({ where: { postId: id } }), prisma.review.deleteMany({ where: { postId: id } }),
            prisma.subtitle.deleteMany({ where: { postId: id } }), prisma.mediaLink.deleteMany({ where: { postId: id } }),
            prisma.post.delete({ where: { id } })
        ]);
        await deleteUploadedFile(post.posterUrl);
    } else if (post.authorId === user.id) {
        await prisma.post.update({ where: { id }, data: { status: 'PENDING_DELETION' } });
    } else { throw new Error('Not authorized.'); }
    await invalidatePostsCache(id, post.seriesId || undefined, post.authorId);
}


'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function createMicroPostComment(postId: string, content: string, parentId?: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error('Not authenticated');
  }

  const data: any = {
    content,
    microPostId: postId,
    userId,
  };

  if (parentId) {
    data.parentId = parentId;
  }

  const newComment = await prisma.microPostComment.create({
    data,
    include: {
      user: true,
      replies: {
        include: {
          user: true,
        },
      },
    },
  });
  
  revalidatePath('/');
  return newComment;
}

export async function updateMicroPostComment(commentId: string, content: string) {
  const session = await auth();
  const user = session?.user;
  if (!user) {
    throw new Error('Not authenticated');
  }

  const comment = await prisma.microPostComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (comment.userId !== user.id && user.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Not authorized to edit this comment');
  }

  const updatedComment = await prisma.microPostComment.update({
    where: { id: commentId },
    data: { content, updatedAt: new Date() },
  });

  revalidatePath('/');
  return updatedComment;
}

export async function deleteMicroPostComment(commentId: string) {
  const session = await auth();
  const user = session?.user;
  if (!user) {
    throw new Error('Not authenticated');
  }

  const comment = await prisma.microPostComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (comment.userId !== user.id && user.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Not authorized to delete this comment');
  }
  
  // The schema is set to cascade delete replies, so we only need to delete the top-level comment
  await prisma.microPostComment.delete({
    where: { id: commentId },
  });

  revalidatePath('/');
}

export async function getCommentsForMicroPost(postId: string) {
    const comments = await prisma.microPostComment.findMany({
        where: {
            microPostId: postId,
            parentId: null, // Only fetch top-level comments
        },
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            user: true,
            replies: { // Include first level of replies
                include: {
                    user: true,
                    replies: { // Include second level of replies
                         include: {
                            user: true,
                         }
                    }
                },
                orderBy: {
                    createdAt: 'asc',
                }
            }
        }
    });
    return comments;
}

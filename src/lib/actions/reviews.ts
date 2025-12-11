
'use server';

import { Prisma, type User, type Review as ReviewWithParent } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { invalidatePostsCache } from './posts';


export async function createReview(
  postId: number,
  comment: string,
  rating: number,
  parentId?: number
): Promise<ReviewWithParent & { user: User, replies: (ReviewWithParent & { user: User })[] }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to post a review.');
  }
  const userId = session.user.id;

  // Verify user exists in database
  const userExists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  if (!userExists) {
    throw new Error('User not found in database. Please try logging out and logging back in.');
  }

  // Verify post exists
  const postExists = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true }
  });

  if (!postExists) {
    throw new Error('Post not found.');
  }

  const reviewData: Prisma.ReviewCreateInput = {
    comment,
    rating: parentId ? 0 : rating, // Replies don't have ratings
    post: { connect: { id: postId } },
    user: { connect: { id: userId } },
  };

  if (parentId) {
    // Verify parent review exists
    const parentExists = await prisma.review.findUnique({
      where: { id: parentId },
      select: { id: true }
    });

    if (!parentExists) {
      throw new Error('Parent review not found.');
    }

    reviewData.parent = { connect: { id: parentId } };
  }

  const newReview = await prisma.review.create({
    data: reviewData,
    include: {
      user: true,
      replies: {
        include: {
          user: true,
        },
      },
    },
  });

  await invalidatePostsCache(postId);

  return newReview as ReviewWithParent & { user: User, replies: (ReviewWithParent & { user: User })[] };
}


export async function deleteReview(reviewId: number) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new Error('Not authenticated.');
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found.');
  }

  const canDelete = user.id === review.userId || user.role === ROLES.SUPER_ADMIN;

  if (!canDelete) {
    throw new Error('You are not authorized to delete this review.');
  }

  // Recursively delete all replies before deleting the parent review
  const replies = await prisma.review.findMany({
    where: { parentId: reviewId }
  });

  for (const reply of replies) {
    await deleteReview(reply.id);
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  await invalidatePostsCache(review.postId);
}

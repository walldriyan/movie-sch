

import { notFound } from 'next/navigation';
import { getSeriesById, getPostsBySeriesId, getPost } from '@/lib/actions';
import type { Post, Series } from '@/lib/types';
import SeriesPageClient from './client';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function SeriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ post?: string }>;
}) {
  const { id } = await params;
  const seriesId = Number(id);
  
  if (isNaN(seriesId)) {
    notFound();
  }

  const session = await auth();
  const user = session?.user;

  const seriesData = (await getSeriesById(seriesId)) as Series | null;
  if (!seriesData) {
    notFound();
  }

  const postsDataRaw = (await getPostsBySeriesId(seriesId)) as Post[];
  if (!postsDataRaw || postsDataRaw.length === 0) {
    // If a series has no posts, it's better to show the series page with an empty state
    // rather than a 404. The client component can handle this.
  }

  const resolvedSearchParams = await searchParams;
  const currentPostIdFromSearch = resolvedSearchParams?.post
    ? Number(resolvedSearchParams.post)
    : undefined;
    
  if (currentPostIdFromSearch && isNaN(currentPostIdFromSearch)) {
      notFound();
  }
    
  const currentPostId = currentPostIdFromSearch ?? postsDataRaw[0]?.id;

  if (!currentPostId) {
    notFound();
  }

  const currentPostData = (await getPost(currentPostId)) as Post | null;
  if (!currentPostData) {
    notFound();
  }
  
  const userSubmissions = user ? await prisma.examSubmission.findMany({
    where: {
      userId: user.id,
      exam: {
        post: {
          seriesId: seriesId,
        },
      },
    },
    include: {
      exam: {
        include: {
          questions: { select: { points: true }},
        },
      },
    },
  }) : [];
  
  const passedExamIds = new Set<number>();
  userSubmissions.forEach(sub => {
    const totalPoints = sub.exam.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = totalPoints > 0 ? (sub.score / totalPoints) * 100 : 0;
    if (percentage >= 50) {
      passedExamIds.add(sub.examId);
    }
  });

  // Server-side calculation of lock status for each post
  const postsData = postsDataRaw.map((post, index) => {
    let isLocked = post.isLockedByDefault;

    // Condition 1: Admins and authors can always see their posts.
    if (user && (user.role === ROLES.SUPER_ADMIN || user.id === post.authorId)) {
      isLocked = false;
    }
    // Condition 2: For other users (including public), check lock logic.
    else {
      if (index === 0) {
        // The first post is locked only if it's set to be locked by default.
        isLocked = post.isLockedByDefault;
      } else {
        // For subsequent posts, check the predecessor.
        const previousPost = postsDataRaw[index - 1];
        // It's locked if the current post is locked by default AND the previous post's unlock conditions are not met.
        isLocked = post.isLockedByDefault && (
          previousPost.requiresExamToUnlock && 
          (!previousPost.exam || !passedExamIds.has(previousPost.exam.id))
        );
      }
    }
    
    return {
      ...post,
      isLocked,
    };
  });
  
  // This log will show the final array sent to the client, with correct isLocked status
  console.log('--- [Server] Final postsData with lock status ---', postsData);


  return (
    <SeriesPageClient
      series={seriesData}
      postsInSeries={postsData}
      initialPost={currentPostData}
      session={session}
      passedExamIds={passedExamIds}
    />
  );
}



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

  let currentPostData = (await getPost(currentPostId)) as Post | null;
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
    if (!sub.exam) return;
    const totalPoints = sub.exam.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = totalPoints > 0 ? (sub.score / totalPoints) * 100 : 0;
    if (percentage >= 50) {
      passedExamIds.add(sub.examId);
    }
  });

  // Server-side calculation of lock status for each post in the tracker list
  const postsData = postsDataRaw.map((post, index) => {
    let isLocked = false; // Default to unlocked
    if (post.isLockedByDefault) {
      // If locked by default, check for unlock conditions
      if (user && (user.role === ROLES.SUPER_ADMIN || user.id === post.authorId)) {
        isLocked = false;
      } else {
        if (index === 0) {
          isLocked = true;
        } else {
          const previousPost = postsDataRaw[index - 1];
          if (previousPost.requiresExamToUnlock) {
             if (!previousPost.exam || !passedExamIds.has(previousPost.exam.id)) {
               isLocked = true;
             }
          } else {
            // if previous post doesn't require an exam, it might depend on another logic in the future.
            // For now, if it's locked by default and not the first post, and prev doesn't require exam, it remains locked based on its own default.
            isLocked = true;
          }
        }
      }
    }
    return {
      ...post,
      isLocked,
    };
  });
  
  // Find the specific lock status for the initial post being displayed
  const initialPostWithLockStatus = postsData.find(p => p.id === currentPostData?.id);
  if (initialPostWithLockStatus) {
    currentPostData.isLocked = initialPostWithLockStatus.isLocked;
  }

  // console.log('--- [Server] Final postsData with lock status ---', postsData);


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

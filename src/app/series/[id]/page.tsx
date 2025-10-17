
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
    notFound();
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
    let isLocked = post.isLockedByDefault; // Default to the DB value

    if (user) {
      // Admins and authors can always view
      if (user.role === ROLES.SUPER_ADMIN || user.id === post.authorId) {
        isLocked = false;
      }
    }
    
    // If still locked, check exam requirements
    if (isLocked) {
      const previousPost = index > 0 ? postsDataRaw[index - 1] : null;
      if (previousPost && previousPost.requiresExamToUnlock && previousPost.exam) {
        if (passedExamIds.has(previousPost.exam.id)) {
          isLocked = false; // Unlock if previous exam is passed
        }
      } else if (!previousPost) {
        // First post is locked by default but has no predecessor exam to pass
        // It remains locked unless user is admin/author
      } else {
         // Previous post does not require an exam to unlock this one
         isLocked = false;
      }
    }

    return {
      ...post,
      isLocked,
    };
  });


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


import { notFound } from 'next/navigation';
import { getSeriesById, getPostsBySeriesId, getPost } from '@/lib/actions';
import type { Post, Series } from '@/lib/types';
import SeriesPageClient from './client';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';

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

  const postsData = (await getPostsBySeriesId(seriesId)) as Post[];
  if (!postsData || postsData.length === 0) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const currentPostIdFromSearch = resolvedSearchParams?.post
    ? Number(resolvedSearchParams.post)
    : undefined;
    
  if (currentPostIdFromSearch && isNaN(currentPostIdFromSearch)) {
      notFound();
  }
    
  const currentPostId = currentPostIdFromSearch ?? postsData[0]?.id;

  if (!currentPostId) {
    notFound();
  }

  const currentPostData = (await getPost(currentPostId)) as Post | null;
  if (!currentPostData) {
    notFound();
  }

  // --- SERVER-SIDE ACCESS CONTROL ---
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

  const isPostLockedForCurrentUser = () => {
    // If post is not locked by default, it's open for everyone.
    if (!currentPostData.isLockedByDefault) {
      return false;
    }
    // If it's locked by default, check for exceptions.
    // Exception 1: User is not logged in, so it's locked.
    if (!user) {
      return true;
    }
    // Exception 2: User is a super admin or the author.
    if (user.role === ROLES.SUPER_ADMIN || user.id === currentPostData.authorId) {
      return false;
    }
    
    // Exception 3: User has passed the prerequisite exam.
    const currentPostIndex = postsData.findIndex(p => p.id === currentPostData.id);
    if (currentPostIndex <= 0) {
      // First post in a series is never locked by exam logic.
      return false; 
    }
    
    const previousPost = postsData[currentPostIndex - 1];
    // If the previous post doesn't require an exam to unlock, this one isn't locked by it.
    if (!previousPost.requiresExamToUnlock) {
      return false;
    }
    
    // If previous post requires exam, check if user passed it.
    if (previousPost.exam && passedExamIds.has(previousPost.exam.id)) {
      return false; // User passed the exam, so it's unlocked.
    }
    
    // If none of the unlock conditions are met, the post is locked.
    return true;
  };

  if (isPostLockedForCurrentUser()) {
    notFound();
  }
  // --- END OF SERVER-SIDE ACCESS CONTROL ---


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

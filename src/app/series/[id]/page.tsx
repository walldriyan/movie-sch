
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


import { notFound } from 'next/navigation';
import { getSeriesById, getPostsBySeriesId } from '@/lib/actions/groupActions';
import { getPost } from '@/lib/actions/postActions';
import type { Post, Series } from '@/lib/types';
import SeriesPageClient from './client';

export default async function SeriesPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { post?: string };
}) {
  const seriesId = Number(params.id);
  if (isNaN(seriesId)) {
    notFound();
  }

  const seriesData = await getSeriesById(seriesId) as Series | null;
  if (!seriesData) {
    notFound();
  }

  const postsData = (await getPostsBySeriesId(seriesId)) as Post[];
  if (!postsData || postsData.length === 0) {
    // Or maybe show a page saying this series has no posts yet
    notFound();
  }
  
  const currentPostIdFromSearch = searchParams?.post ? Number(searchParams.post) : undefined;
  const currentPostId = currentPostIdFromSearch ?? postsData[0]?.id;

  if (!currentPostId) {
    notFound();
  }
  
  const currentPostData = (await getPost(currentPostId)) as Post | null;
  if (!currentPostData) {
    notFound();
  }

  return (
    <SeriesPageClient 
        series={seriesData}
        postsInSeries={postsData}
        initialPost={currentPostData}
    />
  );
}



import { notFound } from 'next/navigation';
import { getPost, canUserDownloadSubtitle, createReview, deleteReview, deleteSubtitle } from '@/lib/actions';
import type { Post, Review, Subtitle } from '@/lib/types';
import MoviePageContent from './movie-page-content';

type SubtitleWithPermission = Subtitle & { canDownload: boolean };

export default async function MoviePage({ params }: { params: { id: string }}) {
  const postId = Number(params.id);
  if (isNaN(postId)) {
    notFound();
  }

  const postData = await getPost(postId) as Post | null;
  
  if (!postData) {
    notFound();
  }
  
  const subtitlesWithPermissions: SubtitleWithPermission[] = await Promise.all(
    (postData.subtitles || []).map(async (subtitle: any) => ({
      ...subtitle,
      canDownload: await canUserDownloadSubtitle(subtitle.id),
    }))
  );

  // Serialize the data to plain objects before passing to the client component
  const serializablePost = JSON.parse(JSON.stringify(postData));
  const serializableSubtitles = JSON.parse(JSON.stringify(subtitlesWithPermissions));

  return (
    <MoviePageContent 
      initialPost={serializablePost}
      initialSubtitles={serializableSubtitles}
    />
  );
}

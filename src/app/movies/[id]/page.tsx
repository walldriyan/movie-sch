
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

  // Serialize the post data
  const serializablePost = {
    ...postData,
    createdAt: postData.createdAt.toISOString(),
    updatedAt: postData.updatedAt.toISOString(),
    author: {
        ...postData.author,
        createdAt: postData.author.createdAt.toISOString(),
        updatedAt: postData.author.updatedAt.toISOString(),
        emailVerified: postData.author.emailVerified ? postData.author.emailVerified.toISOString() : null,
    },
    reviews: postData.reviews.map(review => ({
        ...review,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
        user: {
            ...review.user,
            createdAt: review.user.createdAt.toISOString(),
            updatedAt: review.user.updatedAt.toISOString(),
            emailVerified: review.user.emailVerified ? review.user.emailVerified.toISOString() : null,
        },
        replies: (review.replies || []).map(reply => ({
            ...reply,
            createdAt: reply.createdAt.toISOString(),
            updatedAt: reply.updatedAt.toISOString(),
            user: {
                ...reply.user,
                createdAt: reply.user.createdAt.toISOString(),
                updatedAt: reply.user.updatedAt.toISOString(),
                emailVerified: reply.user.emailVerified ? reply.user.emailVerified.toISOString() : null,
            }
        }))
    })),
    favoritePosts: (postData.favoritePosts || []).map(fav => ({
        ...fav,
        createdAt: fav.createdAt.toISOString(),
    })),
     series: postData.series ? {
        ...postData.series,
        createdAt: postData.series.createdAt.toISOString(),
        updatedAt: postData.series.updatedAt.toISOString(),
    } : null,
  };
  
  const serializableSubtitles = subtitlesWithPermissions.map(sub => ({
      ...sub,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
  }));

  return (
    <MoviePageContent 
      initialPost={serializablePost as Post}
      initialSubtitles={serializableSubtitles as SubtitleWithPermission[]}
    />
  );
}

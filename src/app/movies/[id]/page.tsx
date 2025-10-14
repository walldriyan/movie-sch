
import { notFound } from 'next/navigation';
import { getPost, canUserDownloadSubtitle } from '@/lib/actions';
import type { Post, Review, Subtitle, User } from '@/lib/types';
import MoviePageContent from './movie-page-content';

type SubtitleWithPermission = Subtitle & { canDownload: boolean };

// Helper function to serialize dates
function serializeDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  // If it's already a string, return it as is.
  if (typeof date === 'string') return date;
  // If it's a Date object, convert to ISO string.
  if (date instanceof Date) return date.toISOString();
  return null;
}

// Helper to serialize user object
function serializeUser(user: any): User | null {
  if (!user) return null;
  return {
    ...user,
    createdAt: serializeDate(user.createdAt),
    updatedAt: serializeDate(user.updatedAt),
    emailVerified: serializeDate(user.emailVerified),
  };
}

// Helper to serialize review recursively
function serializeReview(review: any): Review {
  return {
    ...review,
    createdAt: serializeDate(review.createdAt),
    updatedAt: serializeDate(review.updatedAt),
    user: serializeUser(review.user),
    replies: review.replies?.map(serializeReview) || [],
  };
}

export default async function MoviePage({ params }: { params: { id: string }}) {
  const postId = Number(params.id);
  if (isNaN(postId)) {
    notFound();
  }

  const postData = await getPost(postId) as Post | null;
  
  if (!postData) {
    notFound();
  }
  
  // Serialize subtitles with permissions
  const subtitlesWithPermissions: SubtitleWithPermission[] = await Promise.all(
    (postData.subtitles || []).map(async (subtitle: any) => ({
      ...subtitle,
      createdAt: serializeDate(subtitle.createdAt),
      updatedAt: serializeDate(subtitle.updatedAt),
      canDownload: await canUserDownloadSubtitle(subtitle.id),
    }))
  );

  // Serialize post data properly
  const serializablePost = {
    ...postData,
    createdAt: serializeDate(postData.createdAt),
    updatedAt: serializeDate(postData.updatedAt),
    author: serializeUser(postData.author) as User,
    reviews: postData.reviews?.map(serializeReview) || [],
    series: postData.series ? {
      ...postData.series,
      createdAt: serializeDate(postData.series.createdAt),
      updatedAt: serializeDate(postData.series.updatedAt),
    } : null,
    favoritePosts: (postData.favoritePosts || []).map(fav => ({
      ...fav,
      createdAt: serializeDate(fav.createdAt),
    })),
    likedBy: (postData.likedBy || []).map(user => serializeUser(user)),
    dislikedBy: (postData.dislikedBy || []).map(user => serializeUser(user)),
    // Remove circular/complex references that are handled separately or not needed by client
    subtitles: undefined, 
  };


  return (
    <MoviePageContent 
      initialPost={serializablePost as Post}
      initialSubtitles={subtitlesWithPermissions}
    />
  );
}

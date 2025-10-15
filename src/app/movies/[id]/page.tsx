

import { notFound } from 'next/navigation';
import { getPost, canUserDownloadSubtitle } from '@/lib/actions';
import type { Post, Subtitle, User } from '@/lib/types';
import MoviePageContent from './movie-page-content';
import { auth } from '@/auth';
import type { Session } from 'next-auth';

type SubtitleWithPermission = Subtitle & { canDownload: boolean };

// Helper function to serialize dates safely
function serializeDate(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return null;
}

// Helper to serialize user object - ONLY include plain serializable fields
function serializeUser(user: any): any {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    bio: user.bio || null,
    coverImage: user.coverImage || null,
    website: user.website || null,
    twitter: user.twitter || null,
    linkedin: user.linkedin || null,
    emailVerified: serializeDate(user.emailVerified),
    createdAt: serializeDate(user.createdAt),
    updatedAt: serializeDate(user.updatedAt),
    permissions: user.permissions, // Pass permissions through
  };
}

// Helper to serialize review recursively
function serializeReview(review: any): any {
  if (!review) return null;
  return {
    id: review.id,
    comment: review.comment,
    rating: review.rating,
    userId: review.userId,
    postId: review.postId,
    parentId: review.parentId,
    createdAt: serializeDate(review.createdAt),
    updatedAt: serializeDate(review.updatedAt),
    user: serializeUser(review.user),
    replies: (review.replies || []).map(serializeReview).filter(Boolean),
  };
}

export default async function MoviePage({ params }: { params: { id: string }}) {
  const postId = Number(params.id);
  if (isNaN(postId)) {
    notFound();
  }

  const session = await auth();
  console.log("Server [/movies/[id]/page.tsx] Session from auth() on server:", JSON.stringify(session, null, 2));
  console.log("Server [/movies/[id]/page.tsx] Current User Details:", session?.user);

  const postData = await getPost(postId);
  
  if (!postData) {
    notFound();
  }
  
  // Serialize subtitles with permissions
  const subtitlesWithPermissions: any[] = await Promise.all(
    (postData.subtitles || []).map(async (subtitle: any) => ({
      id: subtitle.id,
      language: subtitle.language,
      url: subtitle.url,
      uploaderName: subtitle.uploaderName,
      postId: subtitle.postId,
      userId: subtitle.userId,
      createdAt: serializeDate(subtitle.createdAt),
      updatedAt: serializeDate(subtitle.updatedAt),
      canDownload: await canUserDownloadSubtitle(subtitle.id),
    }))
  );

  // Serialize post data properly - CRITICAL: Remove ALL non-serializable data
  const serializablePost = {
    id: postData.id,
    title: postData.title,
    description: postData.description,
    posterUrl: postData.posterUrl,
    type: postData.type,
    genres: postData.genres || [],
    year: postData.year,
    duration: postData.duration,
    directors: postData.directors,
    mainCast: postData.mainCast,
    imdbRating: postData.imdbRating,
    rottenTomatoesRating: postData.rottenTomatoesRating,
    googleRating: postData.googleRating,
    viewCount: postData.viewCount || 0,
    status: postData.status,
    visibility: postData.visibility,
    seriesId: postData.seriesId,
    orderInSeries: postData.orderInSeries,
    authorId: postData.authorId,
    groupId: postData.groupId,
    createdAt: serializeDate(postData.createdAt),
    updatedAt: serializeDate(postData.updatedAt),
    publishedAt: serializeDate(postData.publishedAt),
    
    // Serialize nested objects
    author: serializeUser(postData.author),
    
    reviews: (postData.reviews || [])
      .map(serializeReview)
      .filter(Boolean),
    
    series: postData.series ? {
      id: postData.series.id,
      title: postData.series.title,
      description: postData.series.description,
      posterUrl: postData.series.posterUrl,
      createdAt: serializeDate(postData.series.createdAt),
      updatedAt: serializeDate(postData.series.updatedAt),
      authorId: postData.series.authorId,
    } : null,
    
    // Serialize media links
    mediaLinks: (postData.mediaLinks || []).map((link: any) => ({
      id: link.id,
      url: link.url,
      type: link.type,
      postId: link.postId,
      createdAt: serializeDate(link.createdAt),
    })),

    // Add required _count, likedBy, dislikedBy, favoritePosts
    _count: postData._count,
    likedBy: (postData.likedBy || []).map(serializeUser),
    dislikedBy: (postData.dislikedBy || []).map(serializeUser),
    favoritePosts: (postData.favoritePosts || []).map((fp:any) => ({
        ...fp,
        createdAt: serializeDate(fp.createdAt),
    })),
  };

  return (
    <MoviePageContent 
      initialPost={serializablePost}
      initialSubtitles={subtitlesWithPermissions}
      session={session}
    />
  );
}



'use client';

import type { Post as PrismaPost, Review as PrismaReview, Subtitle as PrismaSubtitle, User as PrismaUser, FavoritePost as PrismaFavoritePost, Episode, MetaData, Series as PrismaSeries } from "@prisma/client";

export type User = PrismaUser;

export type Review = Omit<PrismaReview, 'parentId'> & {
  user: User;
  replies?: Review[];
  parentId?: number | null;
};

export type Subtitle = PrismaSubtitle;

export type MediaLink = {
  id: number;
  type: 'trailer' | 'image';
  url: string;
}

export type Post = Omit<PrismaPost, 'mediaLinks' | 'genres'> & {
  genres: string[];
  mediaLinks: MediaLink[];
  reviews: Review[];
  subtitles: Subtitle[];
  author: User;
  series?: Series | null;
  favoritePosts?: PrismaFavoritePost[];
  likedBy?: User[];
  dislikedBy?: User[];
  episodes?: Episode[];
  metaData?: MetaData[];
  type: 'MOVIE' | 'TV_SERIES' | 'OTHER';
};

export type Series = Omit<PrismaSeries, 'posts'> & {
  posts: Post[];
  _count?: {
    posts: number;
  }
}

export type PostFormData = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'reviews' | 'subtitles' | 'author' | 'authorId' | 'mediaLinks' | 'favoritePosts' | 'likedBy' | 'dislikedBy' | 'genres' | 'episodes' | 'metaData' | 'series'> & {
  mediaLinks?: Omit<MediaLink, 'id'>[];
  genres?: string[];
  seriesId?: number | null | undefined;
};

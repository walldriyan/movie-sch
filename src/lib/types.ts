'use client';

import type { Post as PrismaPost, Review as PrismaReview, Subtitle as PrismaSubtitle, User as PrismaUser, FavoritePost as PrismaFavoritePost, Episode, MetaData, PostType } from "@prisma/client";

export type User = PrismaUser;

export type Review = PrismaReview & {
  user: User;
};

export type Subtitle = PrismaSubtitle;

export type MediaLink = {
  type: 'trailer' | 'image';
  url: string;
}

export type Post = Omit<PrismaPost, 'mediaLinks' | 'genres'> & {
  genres: string[];
  mediaLinks: MediaLink[];
  reviews: Review[];
  subtitles: Subtitle[];
  author: User;
  favoritedBy?: PrismaFavoritePost[];
  likedBy?: User[];
  dislikedBy?: User[];
  episodes?: Episode[];
  metaData?: MetaData[];
};

export type PostFormData = Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'reviews' | 'subtitles' | 'author' | 'authorId' | 'mediaLinks' | 'favoritedBy' | 'likedBy' | 'dislikedBy' | 'genres' | 'episodes' | 'metaData'> & {
  mediaLinks?: MediaLink[];
  genres?: string[];
};

export type { PostType } from '@prisma/client';

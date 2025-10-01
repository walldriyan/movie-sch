// This file is now mostly redundant as we should be using Prisma-generated types.
// However, some client-side components still rely on them.
// A future refactor could involve using tools like 'zod-prisma' to generate
// Zod schemas from the Prisma schema, and inferring types from those.

import type { Movie as PrismaMovie, Review as PrismaReview, Subtitle as PrismaSubtitle, User as PrismaUser } from "@prisma/client";

export type User = PrismaUser;

export type Review = PrismaReview & {
  user: User;
};

export type Subtitle = PrismaSubtitle;

// This is now redundant with the Prisma model, but kept for client-side compatibility
export type Movie = Omit<PrismaMovie, 'genres'> & {
  genres: string[];
  reviews: Review[];
  subtitles: Subtitle[];
  author: User;
};

export type MovieFormData = Omit<Movie, 'id' | 'createdAt' | 'updatedAt' | 'reviews' | 'subtitles' | 'author' | 'authorId'>;

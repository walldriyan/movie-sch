// This file is now mostly redundant as we should be using Prisma-generated types.
// However, some client-side components still rely on them.
// A future refactor could involve using tools like 'zod-prisma' to generate
// Zod schemas from the Prisma schema, and inferring types from those.

export interface User {
  id: string; // Changed to string to match cuid()
  name: string;
  avatarUrlId: string;
}

export interface Review {
  id: number;
  user: User;
  rating: number;
  comment: string;
}

export interface Subtitle {
  id: number;
  language: string;
  uploader: string;
  price: number;
}

// This is now redundant with the Prisma model, but kept for client-side compatibility
export interface Movie {
  id: number;
  title: string;
  description: string;
  posterUrl: string | null;
  galleryImageIds: string[];
  year: number;
  genres: string[];
  duration: string;
  imdbRating: number;
  viewCount: number;
  likes: number;
  reviews: Review[];
  subtitles: Subtitle[];
  status?: 'PUBLISHED' | 'PENDING_DELETION' | 'DELETED';
}

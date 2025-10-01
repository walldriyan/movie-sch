'use server';

import { PrismaClient } from '@prisma/client';
import type { Movie } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { MovieFormData } from './types';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const prisma = new PrismaClient();

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
    return 'Success';
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function getMovies() {
  const movies = await prisma.movie.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  return movies.map((movie) => ({
    ...movie,
    galleryImageIds: JSON.parse(movie.galleryImageIds || '[]'),
    genres: JSON.parse(movie.genres || '[]'),
  }));
}

export async function getMovie(movieId: number) {
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    include: {
        reviews: {
            include: {
                user: true
            }
        },
        subtitles: true,
    }
  });
  if (!movie) return null;

  return {
    ...movie,
    galleryImageIds: JSON.parse(movie.galleryImageIds || '[]'),
    genres: JSON.parse(movie.genres || '[]'),
  };
}

export async function saveMovie(
  movieData: MovieFormData,
  id?: number
) {
  const data = {
    ...movieData,
    galleryImageIds: JSON.stringify(movieData.galleryImageIds),
    genres: JSON.stringify(movieData.genres),
  };
  
  if (id) {
    await prisma.movie.update({ where: { id }, data: data as any });
    revalidatePath(`/manage`);
    revalidatePath(`/movies/${id}`);
  } else {
    await prisma.movie.create({ data: data as any });
    revalidatePath(`/manage`);
  }
  revalidatePath('/');
}

export async function deleteMovie(id: number, permanent: boolean) {
  if (permanent) {
    await prisma.movie.delete({ where: { id } });
  } else {
    await prisma.movie.update({
      where: { id },
      data: { status: 'PENDING_DELETION' },
    });
  }
  revalidatePath(`/manage`);
  revalidatePath(`/movies/${id}`);
  revalidatePath('/');
}

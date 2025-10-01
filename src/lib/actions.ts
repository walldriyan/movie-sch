'use server';

import { PrismaClient } from '@prisma/client';
import type { Movie } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { MovieFormData } from './types';
import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { ROLES } from './permissions';

const prisma = new PrismaClient();

export async function getSuperAdminEmailForDebug() {
  if (process.env.NODE_ENV === 'development') {
    return process.env.SUPER_ADMIN_EMAIL || null;
  }
  return null;
}

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

export async function doSignOut() {
  await signOut();
}

export async function registerUser(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  const inputData = { name, email };

  try {
     if (!name || !email || !password) {
      return { message: 'Missing name, email, or password', input: inputData };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email as string },
    });

    if (existingUser) {
      return { message: 'User with this email already exists', input: inputData };
    }

    const hashedPassword = await bcrypt.hash(password as string, 12);

    let userRole = ROLES.USER;
    if (process.env.SUPER_ADMIN_EMAIL && email === process.env.SUPER_ADMIN_EMAIL) {
      userRole = ROLES.SUPER_ADMIN;
    }

    await prisma.user.create({
      data: {
        name: name as string,
        email: email as string,
        password: hashedPassword,
        role: userRole,
      },
    });

    // Automatically sign in after registration
    await signIn('credentials', { email, password, redirectTo: '/' });
    
    // This part is unlikely to be reached because signIn will redirect
    return { message: 'Success', input: inputData };

  } catch (error: any) {
    // The `signIn` function can throw a specific error to signal a redirect.
    // We must not catch this error, but let it bubble up to Next.js.
    if (error instanceof AuthError && error.type === 'NEXT_REDIRECT') {
      throw error;
    }
    
    // Handle other specific auth errors if needed
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: 'Sign in after registration failed: Invalid credentials.', input: inputData };
        default:
           return { message: `An unexpected AuthError occurred: ${error.type}`, input: inputData };
      }
    }
    
    // For any other errors, return a generic message
    return { message: `An unexpected error occurred: ${error.message || error}`, input: inputData };
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

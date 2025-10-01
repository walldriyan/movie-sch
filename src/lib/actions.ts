'use server';

import { PrismaClient, Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { MovieFormData } from './types';
import { auth, signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { ROLES } from './permissions';
import { redirect } from 'next/navigation';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

const prisma = new PrismaClient();

export async function getSuperAdminEmailForDebug() {
  if (process.env.NODE_ENV === 'development') {
    return process.env.SUPER_ADMIN_EMAIL || null;
  }
  return null;
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn('credentials', formData);
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

export async function registerUser(
  prevState: { message: string | null, input?: any },
  formData: FormData
): Promise<{ message: string | null, input?: any }> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const formInput = { name, email };


  if (!name || !email || !password) {
    return { message: 'Missing name, email, or password', input: formInput };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { message: 'User with this email already exists', input: formInput };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let userRole = ROLES.USER;
    if (
      process.env.SUPER_ADMIN_EMAIL &&
      email === process.env.SUPER_ADMIN_EMAIL
    ) {
      userRole = ROLES.SUPER_ADMIN;
    }

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
      },
    });

  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle potential database errors, e.g., unique constraint failed again
      return { message: `Could not create user: ${error.code}`, input: formInput };
    }
    return { message: 'An unexpected error occurred during registration.', input: formInput };
  }

  // After successful registration, attempt to sign in
  try {
    await signIn('credentials', { email, password, redirectTo: '/' });
  } catch (error) {
    if (error instanceof AuthError) {
      // Don't redirect here, just show an error on the login page.
      // The user is created, they can try to log in manually.
      redirect(
        '/login?error=Registration%20successful,%20but%20automatic%20login%20failed.'
      );
    }
    // For other errors, we might want to return a message instead of throwing
     if (error instanceof Error) {
        return { message: error.message, input: formInput };
    }
    throw error;
  }
   // This part is unreachable if signIn is successful because it redirects.
   // But needed for type safety.
  return { message: 'Success' };
}

export async function getMovies() {
  const movies = await prisma.movie.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: true,
    },
  });
  return movies.map((movie) => ({
    ...movie,
    genres: JSON.parse(movie.genres || '[]'),
  }));
}

export async function getMovie(movieId: number) {
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    include: {
      reviews: {
        include: {
          user: true,
        },
      },
      subtitles: true,
      author: true,
    },
  });
  if (!movie) return null;

  return {
    ...movie,
    genres: JSON.parse(movie.genres || '[]'),
  };
}

export async function saveMovie(movieData: MovieFormData, id?: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const data = {
    ...movieData,
    genres: JSON.stringify(movieData.genres),
    authorId: session.user.id,
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

export async function getUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });
  return users;
}

export async function uploadProfileImage(formData: FormData) {
  const file = formData.get('image') as File;
  if (!file || file.size === 0) {
    return null;
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${file.name}`;
  const path = join(process.cwd(), 'public/uploads/avatars', filename);

  // Ensure the directory exists
  await mkdir(dirname(path), { recursive: true });

  await writeFile(path, buffer);

  return `/uploads/avatars/${filename}`;
}


export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    bio?: string;
    website?: string;
    twitter?: string;
    linkedin?: string;
    image?: string;
  }
) {
  const session = await auth();
  if (!session?.user || session.user.id !== userId) {
    throw new Error('Not authorized');
  }

  const updateData: { [key: string]: string } = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.bio !== undefined) {
    updateData.bio = data.bio;
  }
  if (data.website !== undefined) {
    updateData.website = data.website;
  }
  if (data.twitter !== undefined) {
    updateData.twitter = data.twitter;
  }
  if (data.linkedin !== undefined) {
    updateData.linkedin = data.linkedin;
  }
  if (data.image !== undefined) {
    updateData.image = data.image;
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  revalidatePath(`/profile/${userId}`);
}

'use server';

import { PrismaClient, Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { MovieFormData } from './types';
import { auth, signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { ROLES, MovieStatus } from './permissions';
import { redirect } from 'next/navigation';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

async function saveImageFromDataUrl(dataUrl: string, subfolder: string): Promise<string | null> {
  if (!dataUrl.startsWith('data:image')) {
    return dataUrl; // It's already a URL, so return it as is.
  }

  try {
    const fileType = dataUrl.substring(dataUrl.indexOf('/') + 1, dataUrl.indexOf(';'));
    const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
    const buffer = Buffer.from(base64Data, 'base64');
    
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileType}`;
    const directory = join(process.cwd(), `public/uploads/${subfolder}`);
    const path = join(directory, filename);

    // Ensure the directory exists
    await mkdir(directory, { recursive: true });
    await writeFile(path, buffer);

    return `/uploads/${subfolder}/${filename}`;
  } catch (error) {
    console.error("Error saving image from data URL:", error);
    return null; // Return null or a default image path on error
  }
}

async function deleteUploadedFile(filePath: string | null | undefined) {
    if (!filePath || !filePath.startsWith('/uploads/')) {
        return; // Not a managed file
    }
    try {
        const fullPath = join(process.cwd(), 'public', filePath);
        await unlink(fullPath);
    } catch (error) {
        console.error(`Failed to delete file: ${filePath}`, error);
    }
}


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
  prevState: { message: string | null; input?: any },
  formData: FormData
): Promise<{ message: string | null; input?: any }> {
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
      return {
        message: 'User with this email already exists',
        input: formInput,
      };
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
      return {
        message: `Could not create user: ${error.code}`,
        input: formInput,
      };
    }
    return {
      message: 'An unexpected error occurred during registration.',
      input: formInput,
    };
  }

  redirect('/login');
}


export async function getMovies(options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.MovieWhereInput = {
      status: MovieStatus.PUBLISHED
    };

    const movies = await prisma.movie.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            author: true,
        },
    });

    const totalMovies = await prisma.movie.count({ where: whereClause });
    const totalPages = Math.ceil(totalMovies / limit);

    return {
        movies: movies.map((movie) => ({
            ...movie,
            genres: JSON.parse(movie.genres || '[]'),
            mediaLinks: JSON.parse(movie.mediaLinks || '[]'),
        })),
        totalPages,
        totalMovies,
    };
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
      likedBy: true,
      dislikedBy: true,
    },
  });
  if (!movie) return null;

  return {
    ...movie,
    genres: JSON.parse(movie.genres || '[]'),
    mediaLinks: JSON.parse(movie.mediaLinks || '[]'),
  };
}

export async function saveMovie(movieData: MovieFormData, id?: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  let status;

  // Handle image upload
  let finalPosterUrl = movieData.posterUrl;
  if (movieData.posterUrl && movieData.posterUrl.startsWith('data:image')) {
    finalPosterUrl = await saveImageFromDataUrl(movieData.posterUrl, 'movies');
  }
  
  const data = {
    title: movieData.title,
    description: movieData.description,
    posterUrl: finalPosterUrl,
    year: movieData.year,
    duration: movieData.duration,
    genres: JSON.stringify(movieData.genres),
    directors: movieData.directors,
    mainCast: movieData.mainCast,
    imdbRating: movieData.imdbRating,
    rottenTomatoesRating: movieData.rottenTomatoesRating,
    googleRating: movieData.googleRating,
    viewCount: movieData.viewCount,
    mediaLinks: JSON.stringify(movieData.mediaLinks || []),
  };

  if (id) {
    const existingMovie = await prisma.movie.findUnique({ where: { id } });
    if (!existingMovie) {
        throw new Error('Movie not found');
    }
    // If posterUrl is changing and the old one was an uploaded file, delete it.
    if (finalPosterUrl !== existingMovie?.posterUrl) {
      await deleteUploadedFile(existingMovie?.posterUrl);
    }
    
    // Determine status on update. Non-super-admins move to PENDING_APPROVAL.
    if (session.user.role === ROLES.SUPER_ADMIN) {
        // Super admin can edit, we might want to keep the status or set it to published
        // For now, let's just update and let status be changed separately if needed.
        // If we want to auto-publish on edit, we can set status here.
        // Let's keep existing status unless it's a draft
        status = existingMovie.status === 'DRAFT' ? MovieStatus.PUBLISHED : existingMovie.status;
    } else {
        status = MovieStatus.PENDING_APPROVAL;
    }

    await prisma.movie.update({ where: { id }, data: { ...data, status } as any });
    revalidatePath(`/manage`);
    revalidatePath(`/movies/${id}`);
  } else {
    // It's a creation
    if (session.user.role === ROLES.USER_ADMIN) {
      status = MovieStatus.PENDING_APPROVAL;
    } else if (session.user.role === ROLES.SUPER_ADMIN) {
      status = MovieStatus.PUBLISHED;
    } else {
       status = movieData.status || 'DRAFT'; // fallback
    }
    await prisma.movie.create({ data: { ...data, status, authorId: session.user.id } as any });
    revalidatePath(`/manage`);
  }
  revalidatePath('/');
}

export async function deleteMovie(id: number, permanent: boolean) {
  const movieToDelete = await prisma.movie.findUnique({ where: { id } });
  if (!movieToDelete) {
    throw new Error("Movie not found");
  }

  if (permanent) {
    await deleteUploadedFile(movieToDelete.posterUrl);
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

export async function uploadProfileImage(formData: FormData): Promise<string | null> {
    const file = formData.get('image') as File;
    if (!file || file.size === 0) {
      return null;
    }
    const dataUrl = await file.arrayBuffer().then(buffer => 
        `data:${file.type};base64,${Buffer.from(buffer).toString('base64')}`
    );
    return saveImageFromDataUrl(dataUrl, 'avatars');
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
  
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  let finalImageUrl = data.image;
  // If a new data URL is provided for the image
  if (data.image && data.image.startsWith('data:image')) {
      finalImageUrl = await saveImageFromDataUrl(data.image, 'avatars');
      // If there was an old image and it was an uploaded file, delete it
      if (currentUser?.image && currentUser.image.startsWith('/uploads/')) {
        await deleteUploadedFile(currentUser.image);
      }
  }


  const updateData = {
    name: data.name,
    bio: data.bio,
    website: data.website,
    twitter: data.twitter,
    linkedin: data.linkedin,
    image: finalImageUrl,
  };

  await prisma.user.update({
    where: { id: userId },
    data: updateData as any,
  });

  revalidatePath(`/profile/${userId}`);
}

export async function requestAdminAccess(
  userId: string,
  message: string
) {
  const session = await auth();
  if (!session?.user || session.user.id !== userId) {
    throw new Error('Not authorized');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      permissionRequestStatus: 'PENDING',
      permissionRequestMessage: message,
    },
  });

  revalidatePath(`/profile/${userId}`);
  revalidatePath('/admin/users');
}

export async function updateUserRole(
  userId: string,
  role: string,
  status: string
) {
  const session = await auth();
  if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Not authorized');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: role,
      permissionRequestStatus: status,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/profile/${userId}`);
}

export async function getMoviesForAdmin(options: { page?: number; limit?: number, userId?: string, userRole?: string } = {}) {
    const { page = 1, limit = 10, userId, userRole } = options;
    
    if (!userId || !userRole) {
        return { movies: [], totalPages: 0, totalMovies: 0 };
    }

    const skip = (page - 1) * limit;

    let whereClause: Prisma.MovieWhereInput = {};

    if (userRole === ROLES.USER_ADMIN) {
        whereClause = { authorId: userId };
    } else if (userRole !== ROLES.SUPER_ADMIN) {
      // For any other role, they shouldn't access this page. But as a safeguard:
      return { movies: [], totalPages: 0, totalMovies: 0 };
    }
    // SUPER_ADMIN has an empty whereClause, fetching all movies.

    const movies = await prisma.movie.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            author: true,
            _count: {
              select: { likedBy: true },
            }
        },
    });

    const totalMovies = await prisma.movie.count({ where: whereClause });
    const totalPages = Math.ceil(totalMovies / limit);

    return {
        movies: movies.map((movie) => ({
            ...movie,
            genres: JSON.parse(movie.genres || '[]'),
            mediaLinks: JSON.parse(movie.mediaLinks || '[]'),
        })),
        totalPages,
        totalMovies,
    };
}


export async function updateMovieStatus(movieId: number, status: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Not authorized to change movie status.');
  }

  if (!Object.values(MovieStatus).includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  await prisma.movie.update({
    where: { id: movieId },
    data: { status },
  });

  revalidatePath('/manage');
}

export async function toggleLikeMovie(movieId: number, like: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  const userId = session.user.id;

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    include: { likedBy: true, dislikedBy: true },
  });

  if (!movie) {
    throw new Error('Movie not found');
  }

  const isLiked = movie.likedBy.some(user => user.id === userId);
  const isDisliked = movie.dislikedBy.some(user => user.id === userId);

  if (like) { // Handle Like action
    if (isLiked) {
      // User is un-liking
      await prisma.movie.update({
        where: { id: movieId },
        data: {
          likedBy: { disconnect: { id: userId } },
        },
      });
    } else {
      // User is liking
      await prisma.movie.update({
        where: { id: movieId },
        data: {
          likedBy: { connect: { id: userId } },
          dislikedBy: { disconnect: isDisliked ? { id: userId } : undefined }, // Remove from dislikes if it was disliked
        },
      });
    }
  } else { // Handle Dislike action
    if (isDisliked) {
      // User is un-disliking
      await prisma.movie.update({
        where: { id: movieId },
        data: {
          dislikedBy: { disconnect: { id: userId } },
        },
      });
    } else {
      // User is disliking
      await prisma.movie.update({
        where: { id: movieId },
        data: {
          dislikedBy: { connect: { id: userId } },
          likedBy: { disconnect: isLiked ? { id: userId } : undefined }, // Remove from likes if it was liked
        },
      });
    }
  }

  revalidatePath(`/movies/${movieId}`);
}

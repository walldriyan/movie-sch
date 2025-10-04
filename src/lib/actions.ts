

'use server';

import { PrismaClient, Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { MovieFormData } from './types';
import { auth, signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { ROLES, MovieStatus, PERMISSIONS } from './permissions';
import { redirect } from 'next/navigation';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

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


export async function getMovies(options: { page?: number; limit?: number, filters?: any } = {}) {
    const { page = 1, limit = 10, filters = {} } = options;
    const skip = (page - 1) * limit;

    let whereClause: Prisma.MovieWhereInput = {
      status: MovieStatus.PUBLISHED
    };
    
    let orderBy: Prisma.MovieOrderByWithRelationInput = { updatedAt: 'desc' };

    const { sortBy, genres, yearRange, ratingRange, timeFilter, authorId, includePrivate } = filters;
    
    if (authorId) {
      whereClause.authorId = authorId;
      if (!includePrivate) {
        whereClause.status = MovieStatus.PUBLISHED;
      } else {
        // If including private, don't filter by status unless specified
        delete whereClause.status;
      }
    }
    
    if (sortBy) {
      const [field, direction] = sortBy.split('-');
      if (['updatedAt', 'imdbRating'].includes(field) && ['asc', 'desc'].includes(direction)) {
        orderBy = { [field]: direction };
      }
    }

    if (genres && genres.length > 0) {
      whereClause.genres = {
        hasSome: genres,
      };
    }

    if (yearRange) {
      whereClause.year = {
        gte: yearRange[0],
        lte: yearRange[1],
      };
    }
    
    if (ratingRange) {
      whereClause.imdbRating = {
        gte: ratingRange[0],
        lte: ratingRange[1],
      };
    }

    if (timeFilter && timeFilter !== 'all') {
      const now = new Date();
      if (timeFilter === 'today') {
        whereClause.createdAt = { gte: startOfDay(now), lte: endOfDay(now) };
      } else if (timeFilter === 'this_week') {
        whereClause.createdAt = { gte: startOfWeek(now), lte: endOfWeek(now) };
      } else if (timeFilter === 'this_month') {
        whereClause.createdAt = { gte: startOfMonth(now), lte: endOfMonth(now) };
      }
    }


    const movies = await prisma.movie.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy,
        include: {
            author: true,
        },
    });

    const totalMovies = await prisma.movie.count({ where: whereClause });
    const totalPages = Math.ceil(totalMovies / limit);

    return {
        movies: movies.map((movie) => ({
            ...movie,
            genres: movie.genres ? (movie.genres as string).split(',') : [],
            mediaLinks: JSON.parse(movie.mediaLinks || '[]'),
        })),
        totalPages,
        totalMovies,
    };
}

export async function getMovie(movieId: number) {
  const session = await auth();
  const userId = session?.user?.id;

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    include: {
      reviews: {
        include: {
          user: true,
        },
      },
      author: true,
      favoritedBy: userId ? { where: { userId } } : false,
      likedBy: true,
      dislikedBy: true,
    },
  });
  
  if (!movie) return null;
  
  const subtitles = await prisma.subtitle.findMany({
    where: { movieId: movieId },
  });

  return {
    ...movie,
    genres: movie.genres ? (movie.genres as string).split(',') : [],
    mediaLinks: JSON.parse(movie.mediaLinks || '[]'),
    subtitles,
  };
}

export async function saveMovie(movieData: MovieFormData, id?: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  const userId = session.user.id;

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
    genres: movieData.genres?.join(',') || '',
    directors: movieData.directors,
    mainCast: movieData.mainCast,
    imdbRating: movieData.imdbRating,
    rottenTomatoesRating: movieData.rottenTomatoesRating,
    googleRating: movieData.googleRating,
    viewCount: movieData.viewCount,
    mediaLinks: JSON.stringify(movieData.mediaLinks || []),
  };

  const status = MovieStatus.PENDING_APPROVAL;

  if (id) {
    const existingMovie = await prisma.movie.findUnique({ where: { id } });
    if (!existingMovie) {
        throw new Error('Movie not found');
    }
    // If posterUrl is changing and the old one was an uploaded file, delete it.
    if (finalPosterUrl !== existingMovie?.posterUrl) {
      await deleteUploadedFile(existingMovie?.posterUrl);
    }
    
    await prisma.movie.update({ 
        where: { id }, 
        data: { ...data, status: status } as any
    });
    revalidatePath(`/manage`);
    revalidatePath(`/movies/${id}`);
  } else {
    await prisma.movie.create({ data: { ...data, status: status, authorId: userId } as any });
    revalidatePath(`/manage`);
  }
  revalidatePath('/');
}

export async function deleteMovie(id: number) {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.permissions?.includes(PERMISSIONS['post.delete'])) {
    throw new Error('Not authorized to delete movies.');
  }

  const movieToDelete = await prisma.movie.findUnique({ where: { id } });
  if (!movieToDelete) {
    throw new Error('Movie not found');
  }

  const isPermanent = user.permissions.includes(PERMISSIONS['post.hard_delete']);

  if (isPermanent) {
    // Super admin performs a hard delete
    // Use a transaction to ensure all related data is deleted before the movie itself
    await prisma.$transaction([
      // Delete related FavoriteMovie entries
      prisma.favoriteMovie.deleteMany({ where: { movieId: id } }),
      // Delete related Review entries
      prisma.review.deleteMany({ where: { movieId: id } }),
       // Delete related Subtitle entries
      prisma.subtitle.deleteMany({ where: { movieId: id } }),
      // Finally, delete the movie
      prisma.movie.delete({ where: { id } }),
    ]);

    await deleteUploadedFile(movieToDelete.posterUrl);
  } else {
    // Other admins (USER_ADMIN) perform a soft delete
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

export async function getMoviesForAdmin(options: { page?: number; limit?: number, userId?: string, userRole?: string, status?: string | null } = {}) {
    const { page = 1, limit = 10, userId, userRole, status } = options;
    const skip = (page - 1) * limit;
    
    if (!userId || !userRole) {
        throw new Error("User ID and role are required");
    }

    let whereClause: Prisma.MovieWhereInput = {};

    if (userRole === ROLES.USER_ADMIN) {
        whereClause = { authorId: userId };
    }

    if(status) {
      whereClause.status = status;
    }

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
            genres: movie.genres ? (movie.genres as string).split(',') : [],
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

  if (!Object.values(MovieStatus).includes(status as any)) {
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

export async function toggleFavoriteMovie(movieId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  const userId = session.user.id;

  const existingFavorite = await prisma.favoriteMovie.findUnique({
    where: {
      userId_movieId: {
        userId,
        movieId,
      },
    },
  });

  if (existingFavorite) {
    await prisma.favoriteMovie.delete({
      where: {
        userId_movieId: {
          userId,
          movieId,
        },
      },
    });
  } else {
    await prisma.favoriteMovie.create({
      data: {
        userId,
        movieId,
      },
    });
  }

  revalidatePath(`/movies/${movieId}`);
  revalidatePath('/favorites');
  revalidatePath(`/profile/${userId}`);
}

export async function getFavoriteMovies() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }
  const userId = session.user.id;

  const favoriteMovies = await prisma.favoriteMovie.findMany({
    where: { userId },
    include: {
      movie: {
        include: {
          author: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return favoriteMovies.map(fav => ({
    ...fav.movie,
    genres: fav.movie.genres ? (fav.movie.genres as string).split(',') : [],
    mediaLinks: JSON.parse(fav.movie.mediaLinks || '[]'),
  }));
}

export async function getFavoriteMoviesByUserId(userId: string) {
  const favoriteMovies = await prisma.favoriteMovie.findMany({
    where: { userId },
    include: {
      movie: {
        include: {
          author: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return favoriteMovies.map(fav => ({
    ...fav.movie,
    genres: fav.movie.genres ? (fav.movie.genres as string).split(',') : [],
    mediaLinks: JSON.parse(fav.movie.mediaLinks || '[]'),
  }));
}

export async function getPendingApprovals() {
  const session = await auth();
  if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
    return { pendingMovies: [], pendingUsers: [] };
  }

  const pendingMovies = await prisma.movie.findMany({
    where: { status: MovieStatus.PENDING_APPROVAL },
    select: { id: true, title: true, author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const pendingUsers = await prisma.user.findMany({
    where: { permissionRequestStatus: 'PENDING' },
    select: { id: true, name: true, email: true },
    orderBy: { updatedAt: 'desc' },
  });

  return { pendingMovies, pendingUsers };
}

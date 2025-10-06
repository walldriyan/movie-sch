

'use server';

import { PrismaClient, Prisma, PostType, Series } from '@prisma/client';
import type { User, Review as ReviewWithParent } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { PostFormData } from './types';
import { auth, signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';
import { ROLES, MovieStatus } from './permissions';
import { redirect } from 'next/navigation';
import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import { join, extname } from 'path';
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


export async function getPosts(options: { page?: number; limit?: number, filters?: any } = {}) {
    const { page = 1, limit = 10, filters = {} } = options;
    const skip = (page - 1) * limit;

    let whereClause: Prisma.PostWhereInput = {
      status: MovieStatus.PUBLISHED,
    };
    
    let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[] = { updatedAt: 'desc' };

    const { sortBy, genres, yearRange, ratingRange, timeFilter, authorId, includePrivate, type } = filters;
    
    if (authorId) {
      whereClause.authorId = authorId;
      if (!includePrivate) {
         whereClause.status = {
            in: [MovieStatus.PUBLISHED]
         }
      } else {
        // If includePrivate is true, we should not filter by PUBLISHED status,
        // but by anything that is not PENDING_DELETION
        whereClause.status = {
          not: MovieStatus.PENDING_DELETION
        }
      }
    }
    
    if (sortBy) {
      const [field, direction] = sortBy.split('-');
      if (['updatedAt', 'imdbRating'].includes(field) && ['asc', 'desc'].includes(direction)) {
        orderBy = { [field]: direction as 'asc' | 'desc' };
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

    if (type && ['MOVIE', 'TV_SERIES', 'OTHER'].includes(type)) {
      whereClause.type = type as 'MOVIE' | 'TV_SERIES' | 'OTHER';
    }

    const posts = await prisma.post.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy,
        include: {
            author: true,
            series: {
              include: {
                _count: {
                  select: { posts: true }
                }
              }
            }
        },
    });

    const totalPosts = await prisma.post.count({ where: whereClause });
    const totalPages = Math.ceil(totalPosts / limit);

    return {
        posts: posts.map((post) => ({
            ...post,
            genres: post.genres ? post.genres.split(',') : [],
        })),
        totalPages,
        totalPosts,
    };
}

export async function getPost(postId: number) {
  const session = await auth();
  const userId = session?.user?.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      reviews: {
        where: { parentId: null }, // Only fetch top-level comments
        include: {
          user: true,
          replies: { // Include replies for each comment
            include: {
              user: true,
              replies: { // Nested replies level 2
                include: {
                  user: true,
                  replies: true, // You can continue nesting if needed
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      author: true,
      favoritePosts: userId ? { where: { userId } } : false,
      likedBy: true,
      dislikedBy: true,
      mediaLinks: true,
      series: true,
    },
  });
  
  if (!post) return null;
  
  const subtitles = await prisma.subtitle.findMany({
    where: { postId: postId },
  });

  return {
    ...post,
    genres: post.genres ? post.genres.split(',') : [],
    subtitles,
  };
}

export async function savePost(postData: PostFormData, id?: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  const userId = session.user.id;

  // Handle image upload
  let finalPosterUrl = postData.posterUrl;
  if (postData.posterUrl && postData.posterUrl.startsWith('data:image')) {
    finalPosterUrl = await saveImageFromDataUrl(postData.posterUrl, 'posts');
  }
  
  const data = {
    title: postData.title,
    description: postData.description,
    posterUrl: finalPosterUrl,
    year: postData.year,
    duration: postData.duration,
    genres: postData.genres?.join(','),
    directors: postData.directors,
    mainCast: postData.mainCast,
    imdbRating: postData.imdbRating,
    rottenTomatoesRating: postData.rottenTomatoesRating,
    googleRating: postData.googleRating,
    viewCount: postData.viewCount,
    type: postData.type || 'MOVIE',
    seriesId: postData.seriesId,
    orderInSeries: postData.orderInSeries,
    updatedAt: new Date(),
  };

  const status = MovieStatus.PENDING_APPROVAL;

  if (id) {
    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) {
        throw new Error('Post not found');
    }
    // If posterUrl is changing and the old one was an uploaded file, delete it.
    if (finalPosterUrl !== existingPost?.posterUrl) {
      await deleteUploadedFile(existingPost?.posterUrl);
    }
    
    await prisma.$transaction([
      prisma.mediaLink.deleteMany({ where: { postId: id } }),
      prisma.post.update({ 
          where: { id }, 
          data: { ...data, status: status, mediaLinks: { create: postData.mediaLinks } } as any
      })
    ]);

    revalidatePath(`/manage`);
    revalidatePath(`/movies/${id}`);
  } else {
    await prisma.post.create({ data: { ...data, status: status, authorId: userId, mediaLinks: { create: postData.mediaLinks } } as any });
    revalidatePath(`/manage`);
  }
  revalidatePath('/');
}

export async function deletePost(id: number) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new Error('Not authorized.');
  }
  
  const postToDelete = await prisma.post.findUnique({ where: { id } });
  if (!postToDelete) {
    throw new Error('Post not found');
  }

  // Check permissions
  const canDelete = 
    user.role === ROLES.SUPER_ADMIN || 
    (user.role === ROLES.USER_ADMIN && postToDelete.authorId === user.id);
  
  if (!canDelete) {
     throw new Error('Not authorized to delete this post.');
  }

  const isPermanent = user.role === ROLES.SUPER_ADMIN;


  if (isPermanent) {
    await prisma.$transaction([
      prisma.favoritePost.deleteMany({ where: { postId: id } }),
      prisma.review.deleteMany({ where: { postId: id } }),
      prisma.subtitle.deleteMany({ where: { id } }),
      prisma.mediaLink.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
    ]);

    await deleteUploadedFile(postToDelete.posterUrl);
  } else {
    await prisma.post.update({
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

export async function uploadProfileCoverImage(formData: FormData): Promise<string | null> {
    const file = formData.get('image') as File;
    if (!file || file.size === 0) {
      return null;
    }
    const dataUrl = await file.arrayBuffer().then(buffer => 
        `data:${file.type};base64,${Buffer.from(buffer).toString('base64')}`
    );
    return saveImageFromDataUrl(dataUrl, 'covers');
}


export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    bio?: string;
    website?: string;
    twitter?: string;
    linkedin?: string;
    image?: string | null;
    coverImage?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user || session.user.id !== userId) {
    throw new Error('Not authorized');
  }
  
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true, coverImage: true },
  });

  let finalImageUrl = data.image;
  if (data.image && data.image.startsWith('data:image')) {
      finalImageUrl = await saveImageFromDataUrl(data.image, 'avatars');
      if (currentUser?.image && currentUser.image.startsWith('/uploads/')) {
        await deleteUploadedFile(currentUser.image);
      }
  }

  let finalCoverImageUrl = data.coverImage;
  if (data.coverImage && data.coverImage.startsWith('data:image')) {
      finalCoverImageUrl = await saveImageFromDataUrl(data.coverImage, 'covers');
      if (currentUser?.coverImage && currentUser.coverImage.startsWith('/uploads/')) {
        await deleteUploadedFile(currentUser.coverImage);
      }
  }

  const updateData = {
    name: data.name,
    bio: data.bio,
    website: data.website,
    twitter: data.twitter,
    linkedin: data.linkedin,
    image: finalImageUrl,
    coverImage: finalCoverImageUrl,
  };

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
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
      permissionsRequestStatus: 'PENDING',
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
      permissionsRequestStatus: status,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/profile/${userId}`);
}

export async function getPostsForAdmin(options: { page?: number; limit?: number, userId?: string, userRole?: string, status?: string | null } = {}) {
    const { page = 1, limit = 10, userId, userRole, status } = options;
    const skip = (page - 1) * limit;
    
    if (!userId || !userRole) {
        throw new Error("User ID and role are required");
    }

    let whereClause: Prisma.PostWhereInput = {};

    if (userRole === ROLES.USER_ADMIN) {
        whereClause = { authorId: userId };
    }

    if(status) {
      whereClause.status = status;
    }

    const posts = await prisma.post.findMany({
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

    const totalPosts = await prisma.post.count({ where: whereClause });
    const totalPages = Math.ceil(totalPosts / limit);

    return {
        posts: posts.map((post) => ({
            ...post,
            genres: post.genres ? post.genres.split(',') : [],
        })),
        totalPages,
        totalPosts,
    };
}


export async function updatePostStatus(postId: number, status: string) {
  const session = await auth();
  if (!session?.user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role)) {
    throw new Error('Not authorized to change post status.');
  }

  if (!Object.values(MovieStatus).includes(status as any)) {
    throw new Error(`Invalid status: ${status}`);
  }
  
  const postToUpdate = await prisma.post.findUnique({ where: { id: postId } });
  if (!postToUpdate) {
    throw new Error('Post not found');
  }
  
  // USER_ADMIN can only approve their own posts or move them to draft/private
  if (session.user.role === ROLES.USER_ADMIN) {
    if (postToUpdate.authorId !== session.user.id) {
       throw new Error('You can only manage status for your own posts.');
    }
  }


  await prisma.post.update({
    where: { id: postId },
    data: { status },
  });

  revalidatePath('/manage');
  revalidatePath(`/movies/${postId}`);
}

export async function toggleLikePost(postId: number, like: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  const userId = session.user.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { likedBy: true, dislikedBy: true },
  });

  if (!post) {
    throw new Error('Post not found');
  }

  const isLiked = post.likedBy.some(user => user.id === userId);
  const isDisliked = post.dislikedBy.some(user => user.id === userId);

  if (like) { // Handle Like action
    if (isLiked) {
      // User is un-liking
      await prisma.post.update({
        where: { id: postId },
        data: {
          likedBy: { disconnect: { id: userId } },
        },
      });
    } else {
      // User is liking
      await prisma.post.update({
        where: { id: postId },
        data: {
          likedBy: { connect: { id: userId } },
          dislikedBy: { disconnect: isDisliked ? { id: userId } : undefined }, // Remove from dislikes if it was disliked
        },
      });
    }
  } else { // Handle Dislike action
    if (isDisliked) {
      // User is un-disliking
      await prisma.post.update({
        where: { id: postId },
        data: {
          dislikedBy: { disconnect: { id: userId } },
        },
      });
    } else {
      // User is disliking
      await prisma.post.update({
        where: { id: postId },
        data: {
          dislikedBy: { connect: { id: userId } },
          likedBy: { disconnect: isLiked ? { id: userId } : undefined }, // Remove from likes if it was liked
        },
      });
    }
  }

  revalidatePath(`/movies/${postId}`);
}

export async function toggleFavoritePost(postId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  const userId = session.user.id;

  const existingFavorite = await prisma.favoritePost.findUnique({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  if (existingFavorite) {
    await prisma.favoritePost.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });
  } else {
    await prisma.favoritePost.create({
      data: {
        userId,
        postId,
      },
    });
  }

  revalidatePath(`/movies/${postId}`);
  revalidatePath('/favorites');
revalidatePath(`/profile/${userId}`);
}

export async function getFavoritePosts() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }
  const userId = session.user.id;

  const favoritePosts = await prisma.favoritePost.findMany({
    where: { userId },
    include: {
      post: {
        include: {
          author: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return favoritePosts.map(fav => ({
    ...fav.post,
    genres: fav.post.genres ? fav.post.genres.split(',') : [],
  }));
}

export async function getPostsByUserId(userId: string, includePrivate: boolean = false) {
  let where: Prisma.PostWhereInput = {
    authorId: userId,
    status: {
      not: MovieStatus.PENDING_DELETION
    }
  };

  if (!includePrivate) {
    where.status = {
      in: [MovieStatus.PUBLISHED]
    }
  }
  
  const userPosts = await prisma.post.findMany({
    where,
    include: {
      author: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
  
  return userPosts.map(post => ({
    ...post,
    genres: post.genres ? post.genres.split(',') : [],
  }));
}


export async function getFavoritePostsByUserId(userId: string) {
  const favoritePosts = await prisma.favoritePost.findMany({
    where: { userId, post: { status: 'PUBLISHED' } },
    include: {
      post: {
        include: {
          author: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return favoritePosts.map(fav => ({
    ...fav.post,
    genres: fav.post.genres ? fav.post.genres.split(',') : [],
  }));
}

export async function getPendingApprovals() {
  const session = await auth();
  const user = session?.user;
  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    return { pendingPosts: [], pendingUsers: [] };
  }

  let whereClause: Prisma.PostWhereInput = { status: MovieStatus.PENDING_APPROVAL };
  if (user.role === ROLES.USER_ADMIN) {
    whereClause.authorId = user.id;
  }
  
  const pendingPosts = await prisma.post.findMany({
    where: whereClause,
    select: { id: true, title: true, author: { select: { name: true } } },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let pendingUsers = [];
  if (user.role === ROLES.SUPER_ADMIN) {
    pendingUsers = await prisma.user.findMany({
      where: { permissionsRequestStatus: 'PENDING' },
      select: { id: true, name: true, email: true },
      orderBy: { updatedAt: 'desc' },
    });
  }


  return { pendingPosts, pendingUsers };
}

export async function getSeries(): Promise<Series[]> {
  const series = await prisma.series.findMany({
    orderBy: { title: 'asc' },
  });
  return series;
}

export async function createSeries(title: string): Promise<Series> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authorized: You must be logged in to create a series.');
  }

  const existingSeries = await prisma.series.findFirst({
    where: { 
      title: {
        equals: title,
      }
    },
  });

  if (existingSeries) {
    throw new Error(`A series with the title "${title}" already exists.`);
  }

  const newSeries = await prisma.series.create({
    data: {
      title,
      authorId: session.user.id,
    },
  });
  
  revalidatePath('/manage');
  return newSeries;
}


export async function createReview(
  postId: number,
  comment: string,
  rating: number,
  parentId?: number
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to post a review.');
  }
  const userId = session.user.id;

  const reviewData: Prisma.ReviewCreateInput = {
    comment,
    rating,
    post: { connect: { id: postId } },
    user: { connect: { id: userId } },
  };

  if (parentId) {
    reviewData.parent = { connect: { id: parentId } };
  }

  const review = await prisma.review.create({
    data: reviewData,
  });

  revalidatePath(`/movies/${postId}`);

  return review;
}

export async function deleteReview(reviewId: number) {
    const session = await auth();
    const user = session?.user;

    if (!user) {
        throw new Error('Not authenticated.');
    }

    const review = await prisma.review.findUnique({
        where: { id: reviewId },
    });

    if (!review) {
        throw new Error('Review not found.');
    }

    const canDelete = user.id === review.userId || user.role === ROLES.SUPER_ADMIN;

    if (!canDelete) {
        throw new Error('You are not authorized to delete this review.');
    }

    // Recursively delete all replies before deleting the parent review
    const replies = await prisma.review.findMany({
        where: { parentId: reviewId }
    });

    for (const reply of replies) {
        await deleteReview(reply.id);
    }
    
    await prisma.review.delete({
        where: { id: reviewId },
    });

    revalidatePath(`/movies/${review.postId}`);
}

export async function getSeriesById(id: number): Promise<Series | null> {
  const series = await prisma.series.findUnique({
    where: { id },
  });
  return series;
}

export async function getPostsBySeriesId(seriesId: number) {
  const posts = await prisma.post.findMany({
    where: {
      seriesId,
      status: {
        not: MovieStatus.PENDING_DELETION
      }
    },
    orderBy: {
      orderInSeries: 'asc'
    },
    include: {
      author: true
    }
  });

  return posts.map((post) => ({
    ...post,
    genres: post.genres ? post.genres.split(',') : [],
  }));
}

export async function getSeriesByAuthorId(authorId: string) {
  const series = await prisma.series.findMany({
    where: {
      authorId: authorId,
    },
    include: {
      _count: {
        select: { posts: true },
      },
      posts: {
        orderBy: {
          orderInSeries: 'asc',
        },
        include: {
          author: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const processedSeries = series.map(s => ({
    ...s,
    posts: s.posts.map(p => ({
      ...p,
      genres: p.genres ? p.genres.split(',') : [],
    }))
  }))

  return processedSeries;
}

export async function uploadSubtitle(formData: FormData) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.name) {
    throw new Error('Not authenticated or user name is missing');
  }

  const file = formData.get('file') as File;
  const language = formData.get('language') as string;
  const postId = Number(formData.get('postId'));

  if (!file || !language || !postId) {
    throw new Error('Missing required fields.');
  }

  // 1. Create subtitle record to get an ID
  const subtitleRecord = await prisma.subtitle.create({
    data: {
      language,
      uploaderName: user.name,
      url: '', // Temporary empty URL
      post: { connect: { id: postId } },
    },
  });

  // 2. Construct filename from ID and save file
  const fileExtension = extname(file.name);
  const filename = `${subtitleRecord.id}${fileExtension}`;
  const directory = join(process.cwd(), `public/uploads/subtitles`);
  await mkdir(directory, { recursive: true });
  const path = join(directory, filename);
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(path, buffer);
  
  const url = `/uploads/subtitles/${filename}`;

  // 3. Update the record with the final URL
  await prisma.subtitle.update({
    where: { id: subtitleRecord.id },
    data: { url: url },
  });


  revalidatePath(`/movies/${postId}`);
}

export async function deleteSubtitle(subtitleId: number) {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new Error('Not authenticated.');
  }

  const subtitle = await prisma.subtitle.findUnique({
    where: { id: subtitleId },
  });

  if (!subtitle) {
    throw new Error('Subtitle not found.');
  }

  const isOwner = user.name === subtitle.uploaderName;
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;

  if (!isOwner && !isSuperAdmin) {
    throw new Error('You are not authorized to delete this subtitle.');
  }

  // Delete file from filesystem
  await deleteUploadedFile(subtitle.url);

  // Delete record from database
  await prisma.subtitle.delete({
    where: { id: subtitleId },
  });

  revalidatePath(`/movies/${subtitle.postId}`);
}


export async function canUserDownloadSubtitle(subtitleId: number): Promise<boolean> {
  // Since the advanced permission system is not in the schema,
  // we'll default to a simple check: is the user logged in?
  // This can be expanded later if the schema is updated.
  const session = await auth();
  return !!session?.user;
}




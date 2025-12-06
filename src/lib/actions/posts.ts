

'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES, MovieStatus } from '@/lib/permissions';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import prisma from '@/lib/prisma';
import type { PostFormData } from '@/lib/types';
import {
  redis,
  redisAvailable,
  getFromCache,
  setInCache,
  deleteFromCache,
  invalidateCachePattern as redisInvalidatePattern,
  getWithCacheLock
} from '../redis';
import { handleError, DatabaseError, AuthenticationError, AuthorizationError } from '../errors';

function generateCacheKey(options: any): string {
  const normalized = {
    page: options.page || 1,
    limit: options.limit || 10,
    filters: options.filters ? {
      sortBy: options.filters.sortBy,
      genres: options.filters.genres?.sort(),
      yearRange: options.filters.yearRange,
      ratingRange: options.filters.ratingRange,
      timeFilter: options.filters.timeFilter,
      authorId: options.filters.authorId,
      type: options.filters.type,
      lockStatus: options.filters.lockStatus,
      search: options.filters.search,
    } : {}
  };
  return `posts:${JSON.stringify(normalized, Object.keys(normalized).sort())}`;
}

const invalidateCachePattern = redisInvalidatePattern;

export async function invalidatePostsCache(postId?: number, seriesId?: number, authorId?: string) {
  console.log(`[Cache] invalidatePostsCache called with: postId=${postId}, seriesId=${seriesId}, authorId=${authorId}`);
  revalidatePath('/');
  revalidatePath('/manage');
  if (postId) {
    revalidatePath(`/movies/${postId}`);
  }
  if (seriesId) {
    revalidatePath(`/series/${seriesId}`);
  }
  if (authorId) {
    revalidatePath(`/profile/${authorId}`);
  }
}


async function getUserGroupIds(userId: string): Promise<string[]> {
  const cacheKey = `user:${userId}:groups`;

  if (redis) {
    try {
      const cached = await redis.get<string[]>(cacheKey);
      if (cached) return cached;
    } catch (error) {
      console.error('[Cache] Redis GET error for user groups:', error);
    }
  }

  const members = await prisma.groupMember.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { groupId: true },
  });

  const groupIds = members.map(m => m.groupId);

  if (redis) {
    try {
      await redis.set(cacheKey, groupIds, { ex: 1800 }); // 30 minutes
    } catch (error) {
      console.error('[Cache] Redis SET error for user groups:', error);
    }
  }

  return groupIds;
}

export async function invalidateUserGroupsCache(userId: string) {
  if (redis) {
    const cacheKey = `user:${userId}:groups`;
    await redis.del(cacheKey);
    console.log(`[Cache] Invalidated user groups cache for userId: ${userId}`);
  }
}


import { STORAGE_CONFIG } from '../storage-config';
import { createClient } from '@supabase/supabase-js';

export async function saveImageFromDataUrl(dataUrl: string, subfolder: string): Promise<string | null> {
  console.log(`[SERVER: STEP 5.3] saveImageFromDataUrl: Saving image to subfolder: ${subfolder}`);
  if (!dataUrl.startsWith('data:image')) {
    console.log(`[Image Save] Provided URL is not a data URL, returning as is: ${dataUrl}`);
    return dataUrl;
  }

  try {
    const fileType = dataUrl.substring(dataUrl.indexOf('/') + 1, dataUrl.indexOf(';'));
    const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
    const buffer = Buffer.from(base64Data, 'base64');

    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileType}`;

    if (STORAGE_CONFIG.provider === 'local') {
      const directory = join(process.cwd(), STORAGE_CONFIG.localRoot, subfolder);
      const path = join(directory, filename);

      console.log(`[SERVER: STEP 5.4] Preparing to write file to path: ${path}`);
      await mkdir(directory, { recursive: true });
      await writeFile(path, buffer);
      console.log(`[SERVER: STEP 5.5] Successfully wrote file to path: ${path}`);

      // Construct public URL using the configured prefix
      const prefix = STORAGE_CONFIG.publicUrlPrefix.replace(/\/$/, '');
      const publicUrl = `${prefix}/${subfolder}/${filename}`;

      console.log(`[SERVER: STEP 5.6] Returning public URL: ${publicUrl}`);
      return publicUrl;
    } else if (STORAGE_CONFIG.provider === 'supabase') {
      console.log('[Image Save] Uploading to Supabase Storage...');
      const supabase = createClient(STORAGE_CONFIG.supabase.url, STORAGE_CONFIG.supabase.anonKey);

      const { data, error } = await supabase.storage
        .from(STORAGE_CONFIG.supabase.bucket)
        .upload(`${subfolder}/${filename}`, buffer, {
          contentType: `image/${fileType}`,
          upsert: false
        });

      if (error) {
        console.error('[Image Save] Supabase upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_CONFIG.supabase.bucket)
        .getPublicUrl(`${subfolder}/${filename}`);

      console.log(`[Image Save] Upload successful. Public URL: ${publicUrl}`);
      return publicUrl;
    } else {
      console.warn(`[Image Save] Provider '${STORAGE_CONFIG.provider}' not implemented yet.`);
      return null;
    }
  } catch (error) {
    console.error("[Image Save] Error saving image from data URL:", error);
    return null;
  }
}

export async function deleteUploadedFile(filePath: string | null | undefined) {
  if (!filePath) return;

  if (STORAGE_CONFIG.provider === 'local') {
    // Check if the file path starts with our configured prefix
    if (!filePath.startsWith(STORAGE_CONFIG.publicUrlPrefix)) {
      return;
    }

    try {
      const relativePath = filePath.substring(STORAGE_CONFIG.publicUrlPrefix.length);
      const fullPath = join(process.cwd(), STORAGE_CONFIG.localRoot, relativePath);

      await unlink(fullPath);
      console.log(`[File System] Deleted file: ${fullPath}`);
    } catch (error) {
      console.error(`Failed to delete file: ${filePath}`, error);
    }
  } else if (STORAGE_CONFIG.provider === 'supabase') {
    try {
      // Extract the path relative to the bucket
      // Supabase public URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
      // We need to extract <path>
      const bucketUrl = `${STORAGE_CONFIG.supabase.url}/storage/v1/object/public/${STORAGE_CONFIG.supabase.bucket}/`;

      if (!filePath.startsWith(bucketUrl)) {
        console.warn(`[File Delete] File path does not match Supabase bucket URL: ${filePath}`);
        return;
      }

      const relativePath = filePath.replace(bucketUrl, '');
      console.log(`[File Delete] Deleting from Supabase: ${relativePath}`);

      const supabase = createClient(STORAGE_CONFIG.supabase.url, STORAGE_CONFIG.supabase.anonKey);
      const { error } = await supabase.storage
        .from(STORAGE_CONFIG.supabase.bucket)
        .remove([relativePath]);

      if (error) {
        console.error('[File Delete] Supabase delete error:', error);
      } else {
        console.log('[File Delete] Successfully deleted from Supabase');
      }
    } catch (error) {
      console.error(`Failed to delete file from Supabase: ${filePath}`, error);
    }
  } else {
    console.warn(`[File Delete] Provider '${STORAGE_CONFIG.provider}' not implemented yet.`);
  }
}

async function fetchPostsFromDB(options: { page?: number; limit?: number, filters?: any } = {}) {
  console.log('--- DEBUG: fetchPostsFromDB START ---');
  console.log('[DB Fetch] Received options:', JSON.stringify(options, null, 2));

  const { page = 1, limit = 10, filters = {} } = options;
  const skip = (page - 1) * limit;
  const session = await auth();
  const user = session?.user;
  const userRole = user?.role;
  console.log(`[DB Fetch] User Role: ${userRole || 'Guest'}`);

  let whereClause: Prisma.PostWhereInput = {};

  const { sortBy, genres, yearRange, ratingRange, timeFilter, authorId, includePrivate, type, lockStatus, search } = filters;
  console.log(`[DB Fetch] Filter - lockStatus: ${lockStatus}, search: ${search}`);

  // --- Role-Based Access Control & Lock Status Logic ---
  if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.USER_ADMIN) {
    // Admins can see all non-deleted posts, lock status is just a filter
    whereClause.status = { not: MovieStatus.PENDING_DELETION };
    if (lockStatus === 'locked') {
      whereClause.isLockedByDefault = true;
    } else if (lockStatus === 'unlocked') {
      whereClause.isLockedByDefault = false;
    }
    // If lockStatus is undefined, we don't filter by it for admins.
  } else { // Regular user or guest
    whereClause.status = MovieStatus.PUBLISHED;

    const publicCriteria: Prisma.PostWhereInput = { visibility: 'PUBLIC' };
    if (lockStatus === 'locked') {
      publicCriteria.isLockedByDefault = true;
    } else {
      // For guests or regular users, default to showing only unlocked public posts
      publicCriteria.isLockedByDefault = false;
    }

    if (user) { // Logged-in regular user
      const userGroupIds = await getUserGroupIds(user.id);
      const groupCriteria: Prisma.PostWhereInput = {
        visibility: 'GROUP_ONLY',
        groupId: { in: userGroupIds },
      };
      if (lockStatus === 'locked') {
        groupCriteria.isLockedByDefault = true;
      } else {
        groupCriteria.isLockedByDefault = false;
      }
      whereClause.OR = [publicCriteria, groupCriteria];
    } else { // Guest
      whereClause = { ...whereClause, ...publicCriteria };
    }
  }


  // Apply additional filters
  let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[] = { updatedAt: 'desc' };

  if (authorId) {
    whereClause.authorId = authorId;
    if (!includePrivate) {
      whereClause.status = {
        in: [MovieStatus.PUBLISHED]
      }
    } else if (!userRole || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(userRole)) {
      // Non-admins viewing a profile can't see non-published posts even if includePrivate is true
      whereClause.status = {
        in: [MovieStatus.PUBLISHED]
      };
    }
  }

  if (sortBy) {
    const [field, direction] = sortBy.split('-');
    if (['updatedAt', 'imdbRating', 'createdAt'].includes(field) && ['asc', 'desc'].includes(direction)) {
      orderBy = { [field]: direction as 'asc' | 'desc' };
    }
  }

  // For SQLite: Use contains with OR for each genre
  // For PostgreSQL: Could use hasSome, but contains works for both
  if (genres && genres.length > 0) {
    whereClause.OR = [
      ...(whereClause.OR || []),
      ...genres.map((genre: string) => ({ genres: { contains: genre } }))
    ];
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

  // Search filter - search in title and description
  // NOTE: We need to use AND to combine search with access control (not add to existing OR)
  if (search && search.trim()) {
    const searchTerm = search.trim().toLowerCase();
    // Wrap existing where clause and add search as AND condition
    const existingWhere = { ...whereClause };
    whereClause = {
      AND: [
        existingWhere,
        {
          OR: [
            { title: { contains: searchTerm } },
            { description: { contains: searchTerm } },
            { genres: { contains: searchTerm } },
          ]
        }
      ]
    };
  }

  console.log('[DB Fetch] FINAL whereClause:', JSON.stringify(whereClause, null, 2));

  const [posts, totalPosts] = await prisma.$transaction([
    prisma.post.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy,
      include: {
        author: true,
        series: {
          include: {
            posts: {
              select: { posterUrl: true },
              orderBy: { orderInSeries: 'asc' },
            },
            _count: {
              select: { posts: true }
            }
          }
        },
        likedBy: {
          select: {
            id: true,
            name: true,
            image: true,
          },
          take: 5,
        },
        _count: {
          select: {
            likedBy: true,
            reviews: true,
          }
        }
      },
    }),
    prisma.post.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(totalPosts / limit);
  console.log(`[DB Fetch] Found ${totalPosts} posts. Returning ${posts.length} for page ${page}. Total pages: ${totalPages}`);
  console.log('--- DEBUG: fetchPostsFromDB END ---');
  return {
    posts: posts.map((post) => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      author: {
        ...post.author,
        createdAt: post.author.createdAt.toISOString(),
        updatedAt: post.author.updatedAt.toISOString(),
        emailVerified: post.author.emailVerified ? post.author.emailVerified.toISOString() : null,
      },
      series: post.series ? {
        ...post.series,
        createdAt: post.series.createdAt.toISOString(),
        updatedAt: post.series.updatedAt.toISOString(),
        posts: post.series.posts,
      } : null,
    })),
    totalPages,
    totalPosts,
  };
}


export async function getPosts(options: { page?: number; limit?: number, filters?: any } = {}) {
  const cacheKey = generateCacheKey(options);
  // Disabling cache for this specific high-level fetch to avoid complexity during debugging
  // const result = await getWithCacheLock(cacheKey, () => fetchPostsFromDB(options));
  const result = await fetchPostsFromDB(options);
  return result;
}


export async function getPost(postId: number) {
  console.log(`[Action: getPost] Fetching post with ID: ${postId}`);
  const session = await auth();
  const userId = session?.user?.id;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      reviews: {
        where: { parentId: null },
        include: {
          user: true,
          replies: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      author: true,
      favoritePosts: userId ? { where: { userId } } : false,
      likedBy: true,
      dislikedBy: true,
      mediaLinks: true,
      series: true,
      exam: {
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          title: true,
          description: true
        }
      },
      _count: true,
    },
  });

  if (!post) {
    console.log(`[Action: getPost] Post with ID ${postId} not found.`);
    return null;
  }

  const subtitles = await prisma.subtitle.findMany({
    where: { postId: postId },
  });

  console.log(`[Action: getPost] Successfully fetched post "${post.title}".`);
  return {
    ...post,
    genres: post.genres ? post.genres.split(',') : [],
    subtitles,
  };
}


export async function incrementViewCount(postId: number) {
  try {
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });
    // await invalidatePostsCache(postId); // Re-enabled if needed, but might be too aggressive
    return updatedPost.viewCount;
  } catch (error) {
    console.error(`Failed to increment view count for post ${postId}:`, error);
    // We re-throw the error so the client-side catch block can handle it.
    throw error;
  }
}

export async function savePost(postData: PostFormData, id?: number) {
  console.log(`[Action: savePost] Starting save process. ID: ${id || 'new'}`);
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('User not found.');
  }

  // --- Start Daily Post Limit Check ---
  if (!id) { // Only check for new posts, not edits
    console.log('[Action: savePost] Checking daily post limit.');
    const defaultLimitSetting = await prisma.appSetting.findUnique({ where: { key: 'dailyPostLimit_default' } });
    const defaultLimit = defaultLimitSetting ? parseInt(defaultLimitSetting.value, 10) : 10;

    const postLimit = user.dailyPostLimit ?? defaultLimit;

    if (postLimit > 0) {
      const twentyFourHoursAgo = subDays(new Date(), 1);
      const userPostCount = await prisma.post.count({
        where: {
          authorId: userId,
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
      });

      if (userPostCount >= postLimit) {
        console.error(`[Action: savePost] User ${userId} has reached daily post limit of ${postLimit}.`);
        throw new Error(`You have reached your daily post limit of ${postLimit}.`);
      }
      console.log(`[Action: savePost] User ${userId} has ${postLimit - userPostCount} posts remaining.`);
    }
  }
  // --- End Daily Post Limit Check ---

  let finalPosterUrl = postData.posterUrl;
  if (postData.posterUrl && postData.posterUrl.startsWith('data:image')) {
    console.log('[Action: savePost] Saving new poster image from data URL.');
    finalPosterUrl = await saveImageFromDataUrl(postData.posterUrl, 'posts');
  }

  const data: any = {
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
    visibility: postData.visibility,
    groupId: postData.visibility === 'GROUP_ONLY' ? postData.groupId : null,
    isLockedByDefault: postData.isLockedByDefault,
    requiresExamToUnlock: postData.requiresExamToUnlock,
  };

  const status = MovieStatus.PENDING_APPROVAL;

  if (id) {
    console.log(`[Action: savePost] Updating existing post with ID: ${id}`);
    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) {
      throw new Error('Post not found');
    }
    if (finalPosterUrl && finalPosterUrl !== existingPost.posterUrl) {
      await deleteUploadedFile(existingPost.posterUrl);
    }

    await prisma.$transaction([
      prisma.mediaLink.deleteMany({ where: { postId: id } }),
      prisma.post.update({
        where: { id },
        data: {
          ...data,
          status: status,
          mediaLinks: { create: postData.mediaLinks }
        }
      })
    ]);

  } else {
    console.log('[Action: savePost] Creating new post.');
    await prisma.post.create({ data: { ...data, status: status, authorId: userId, mediaLinks: { create: postData.mediaLinks } } });
  }

  // Revalidate paths to reflect changes
  revalidatePath('/');
  revalidatePath('/manage');

  console.log(`[Action: savePost] Save process finished for post ID: ${id || 'new'}.`);
}

export async function deletePost(id: number) {
  console.log(`[Action: deletePost] Attempting to delete post with ID: ${id}`);
  const session = await auth();
  const user = session?.user;

  if (!user) {
    throw new Error('Not authorized.');
  }

  const postToDelete = await prisma.post.findUnique({ where: { id } });
  if (!postToDelete) {
    throw new Error('Post not found');
  }

  const isAuthor = postToDelete.authorId === user.id;
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;

  if (!isAuthor && !isSuperAdmin) {
    throw new Error('Not authorized to delete this post.');
  }

  if (isSuperAdmin) {
    console.log(`[Action: deletePost] Super Admin ${user.id} is hard deleting post ${id}.`);
    await prisma.$transaction([
      prisma.favoritePost.deleteMany({ where: { postId: id } }),
      prisma.review.deleteMany({ where: { postId: id } }),
      prisma.subtitle.deleteMany({ where: { postId: id } }),
      prisma.mediaLink.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
    ]);

    await deleteUploadedFile(postToDelete.posterUrl);
  } else { // isAuthor
    console.log(`[Action: deletePost] Author ${user.id} is soft deleting post ${id}.`);
    await prisma.post.update({
      where: { id },
      data: { status: 'PENDING_DELETION' },
    });
  }

  await invalidatePostsCache(id, postToDelete.seriesId ?? undefined, postToDelete.authorId);
  console.log(`[Action: deletePost] Post ${id} processed for deletion. Paths revalidated.`);
}


export async function getPostsForAdmin(options: { page?: number; limit?: number, userId?: string, userRole?: string, status?: string | null, sortBy?: string } = {}) {
  const { page = 1, limit = 10, userId, userRole, status, sortBy = 'createdAt-desc' } = options;
  console.log('[Action: getPostsForAdmin] Fetching posts for admin view with options:', options);
  const skip = (page - 1) * limit;

  if (!userId || !userRole) {
    throw new Error("User ID and role are required");
  }

  let whereClause: Prisma.PostWhereInput = {};

  if (userRole === ROLES.USER_ADMIN) {
    whereClause = { authorId: userId };
  }

  if (status) {
    whereClause.status = status;
  }

  const [field, direction] = sortBy.split('-');
  const orderBy = { [field]: direction };


  const [posts, totalPosts] = await prisma.$transaction([
    prisma.post.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy,
      include: {
        author: true,
        group: {
          select: {
            name: true,
          }
        },
        _count: {
          select: { likedBy: true },
        },
        series: {
          include: {
            _count: {
              select: { posts: true }
            }
          }
        }
      },
    }),
    prisma.post.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(totalPosts / limit);
  console.log(`[Action: getPostsForAdmin] Found ${totalPosts} posts. Returning page ${page} of ${totalPages}.`);

  return {
    posts: posts.map((post) => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      author: {
        ...post.author,
        createdAt: post.author.createdAt.toISOString(),
        updatedAt: post.author.updatedAt.toISOString(),
        emailVerified: post.author.emailVerified ? post.author.emailVerified.toISOString() : null,
      },
      series: post.series ? {
        ...post.series,
        createdAt: post.series.createdAt.toISOString(),
        updatedAt: post.series.updatedAt.toISOString(),
      } : null,
    })),
    totalPages,
    totalPosts,
  };
}


export async function updatePostStatus(postId: number, status: string) {
  console.log(`[Action: updatePostStatus] Attempting to update post ${postId} to status: ${status}`);
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

  if (session.user.role === ROLES.USER_ADMIN) {
    if (postToUpdate.authorId !== session.user.id) {
      throw new Error('You can only manage status for your own posts.');
    }
  }

  await prisma.post.update({
    where: { id: postId },
    data: { status },
  });

  await invalidatePostsCache(postId, postToUpdate.seriesId ?? undefined, postToUpdate.authorId);
  console.log(`[Action: updatePostStatus] Successfully updated post ${postId} to status: ${status}`);
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

  if (like) {
    if (isLiked) {
      await prisma.post.update({
        where: { id: postId },
        data: {
          likedBy: { disconnect: { id: userId } },
        },
      });
    } else {
      await prisma.post.update({
        where: { id: postId },
        data: {
          likedBy: { connect: { id: userId } },
          dislikedBy: { disconnect: isDisliked ? { id: userId } : undefined },
        },
      });
    }
  } else {
    if (isDisliked) {
      await prisma.post.update({
        where: { id: postId },
        data: {
          dislikedBy: { disconnect: { id: userId } },
        },
      });
    } else {
      await prisma.post.update({
        where: { id: postId },
        data: {
          dislikedBy: { connect: { id: userId } },
          likedBy: { disconnect: isLiked ? { id: userId } : undefined },
        },
      });
    }
  }

  revalidatePath('/');
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

  await invalidatePostsCache(postId, undefined, userId);
}

export async function getFavoritePosts() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }
  const userId = session.user.id;

  const favoritePosts = await prisma.favoritePost.findMany({
    where: { userId, post: { status: 'PUBLISHED' } },
    include: {
      post: {
        include: {
          author: true,
          series: {
            include: {
              _count: {
                select: { posts: true }
              }
            }
          },
          likedBy: {
            select: {
              id: true,
              name: true,
              image: true,
            },
            take: 5,
          },
          _count: {
            select: {
              likedBy: true,
              reviews: true,
            }
          }
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

export async function searchPostsForExam(query: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const posts = await prisma.post.findMany({
    where: {
      // Note: mode: 'insensitive' is PostgreSQL only, removing for SQLite compatibility
      // In production PostgreSQL, add mode: 'insensitive' back
      title: {
        contains: query,
      },
      status: 'PUBLISHED', // Only allow exams for published posts
    },
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      group: {
        select: {
          name: true
        }
      }
    }
  });

  return posts;
}

export async function updatePostLockSettings(
  postId: number,
  isLockedByDefault: boolean,
  requiresExamToUnlock: boolean
) {
  const session = await auth();
  const user = session?.user;
  if (!user) {
    throw new Error("Not authenticated");
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new Error("Post not found");
  }

  const isAuthor = post.authorId === user.id;
  const isAdmin = user.role === ROLES.SUPER_ADMIN || user.role === ROLES.USER_ADMIN;

  if (!isAuthor && !isAdmin) {
    throw new Error("Not authorized to update this post's lock settings.");
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      isLockedByDefault,
      requiresExamToUnlock,
    },
  });

  await invalidatePostsCache(postId, post.seriesId ?? undefined, post.authorId);
  revalidatePath(`/manage`);
  if (post.seriesId) {
    revalidatePath(`/series/${post.seriesId}`);
  }
}

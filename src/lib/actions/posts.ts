
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
import { redis } from '../redis';

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
    } : {}
  };
  return `posts:${JSON.stringify(normalized, Object.keys(normalized).sort())}`;
}

async function invalidateCachePattern(pattern: string) {
  if (!redis) return;
  try {
    let cursor = 0;
    let deletedCount = 0;
    
    do {
      const [newCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: 100
      });
      
      cursor = newCursor;
      
      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== 0);
    
    console.log(`[Cache] Invalidated ${deletedCount} keys for pattern "${pattern}"`);
  } catch (error) {
    console.error('[Cache] Redis invalidation error:', error);
  }
}

export async function invalidatePostsCache(postId?: number, seriesId?: number, authorId?: string) {
    if (postId) {
        // More specific invalidation if possible, for now we clear patterns
        await invalidateCachePattern(`posts:*"id":${postId}*`);
    }
    if (seriesId) {
        await invalidateCachePattern(`posts:*"seriesId":${seriesId}*`);
    }
    if (authorId) {
        await invalidateCachePattern(`posts:*"authorId":"${authorId}"*`);
    }
    // Invalidate general lists
    await invalidateCachePattern(`posts:*`);
}

async function getWithCacheLock<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const lockKey = `lock:${cacheKey}`;
  const lockTTL = 10; // 10 seconds

  if (redis) {
    try {
      const cached = await redis.get<T>(cacheKey);
      if (cached) {
        console.log(`[Cache] HIT for key: ${cacheKey}`);
        return cached;
      }
      
      const locked = await redis.set(lockKey, '1', { ex: lockTTL, nx: true });
      
      if (!locked) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const retryCache = await redis.get<T>(cacheKey);
        if (retryCache) return retryCache;
      }
    } catch (error) {
      console.error('[Cache] Redis error:', error);
    }
  }
  
  console.log(`[Cache] MISS for key: ${cacheKey}`);
  try {
    const result = await fetchFn();
    
    if (redis) {
        await redis.set(cacheKey, result, { ex: ttl });
        await redis.del(lockKey);
    }
    
    return result;
  } catch (error) {
    if (redis) await redis.del(lockKey);
    throw error;
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
    }
}


export async function saveImageFromDataUrl(dataUrl: string, subfolder: string): Promise<string | null> {
  if (!dataUrl.startsWith('data:image')) {
    return dataUrl; 
  }

  try {
    const fileType = dataUrl.substring(dataUrl.indexOf('/') + 1, dataUrl.indexOf(';'));
    const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
    const buffer = Buffer.from(base64Data, 'base64');
    
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileType}`;
    const directory = join(process.cwd(), `public/uploads/${subfolder}`);
    const path = join(directory, filename);

    await mkdir(directory, { recursive: true });
    await writeFile(path, buffer);

    return `/uploads/${subfolder}/${filename}`;
  } catch (error) {
    console.error("Error saving image from data URL:", error);
    return null;
  }
}

export async function deleteUploadedFile(filePath: string | null | undefined) {
    if (!filePath || !filePath.startsWith('/uploads/')) {
        return; 
    }
    try {
        const fullPath = join(process.cwd(), 'public', filePath);
        await unlink(fullPath);
    } catch (error) {
        console.error(`Failed to delete file: ${filePath}`, error);
    }
}

async function fetchPostsFromDB(options: { page?: number; limit?: number, filters?: any } = {}) {
    const { page = 1, limit = 10, filters = {} } = options;
    const skip = (page - 1) * limit;
    const session = await auth();
    const user = session?.user;
    const userRole = user?.role;

    let whereClause: Prisma.PostWhereInput = {};
    
    const { sortBy, genres, yearRange, ratingRange, timeFilter, authorId, includePrivate, type, lockStatus } = filters;
    
    // --- Role-Based Access Control Logic ---
    if (userRole === ROLES.SUPER_ADMIN) {
        whereClause.status = { not: MovieStatus.PENDING_DELETION };
    } else if (userRole === ROLES.USER_ADMIN) {
        whereClause = {
            OR: [
                { authorId: user.id, status: { not: MovieStatus.PENDING_DELETION } },
                { status: MovieStatus.PUBLISHED, visibility: 'PUBLIC' }
            ],
        };
    } else { // Regular user or guest
        const publicCriteria: Prisma.PostWhereInput = {
            status: MovieStatus.PUBLISHED,
            visibility: 'PUBLIC',
        };

        if (user) { // Logged-in regular user
            const userGroupIds = await getUserGroupIds(user.id);

            whereClause = {
                 OR: [
                    publicCriteria,
                    {
                        status: MovieStatus.PUBLISHED,
                        visibility: 'GROUP_ONLY',
                        groupId: { in: userGroupIds },
                    }
                ]
            }
        } else { // Guest
            whereClause = publicCriteria;
        }
    }
    
    if (lockStatus === 'locked') {
        whereClause.isLockedByDefault = true;
    } else if (lockStatus === 'unlocked' || (lockStatus === undefined && userRole !== ROLES.SUPER_ADMIN)) {
        whereClause.isLockedByDefault = false;
    }


    // Apply additional filters
    let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[] = { updatedAt: 'desc' };

    if (authorId) {
      whereClause.authorId = authorId;
      if (!includePrivate) {
         whereClause.status = {
            in: [MovieStatus.PUBLISHED]
         }
      } else {
        whereClause.status = {
          not: MovieStatus.PENDING_DELETION
        }
      }
    }
    
    if (sortBy) {
      const [field, direction] = sortBy.split('-');
      if (['updatedAt', 'imdbRating', 'createdAt'].includes(field) && ['asc', 'desc'].includes(direction)) {
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
    const result = await getWithCacheLock(cacheKey, () => fetchPostsFromDB(options));
    return result;
}


export async function getPost(postId: number) {
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
              replies: { 
                include: {
                  user: true,
                  replies: true,
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
        await invalidatePostsCache(postId);
        return updatedPost.viewCount;
    } catch (error) {
        console.error(`Failed to increment view count for post ${postId}:`, error);
        // We re-throw the error so the client-side catch block can handle it.
        throw error;
    }
}

export async function savePost(postData: PostFormData, id?: number) {
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
    const defaultLimitSetting = await prisma.appSetting.findUnique({ where: { key: 'dailyPostLimit_default' }});
    const defaultLimit = defaultLimitSetting ? parseInt(defaultLimitSetting.value, 10) : 10;
    
    // User-specific limit overrides the default
    const postLimit = user.dailyPostLimit ?? defaultLimit;

    if (postLimit > 0) { // A limit of 0 means unlimited
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
        throw new Error(`You have reached your daily post limit of ${postLimit}.`);
      }
    }
  }
  // --- End Daily Post Limit Check ---

  let finalPosterUrl = postData.posterUrl;
  if (postData.posterUrl && postData.posterUrl.startsWith('data:image')) {
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
    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) {
        throw new Error('Post not found');
    }
    // Only delete the old poster if a new one is uploaded and they are different
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
    await prisma.post.create({ data: { ...data, status: status, authorId: userId, mediaLinks: { create: postData.mediaLinks } } });
  }
  await invalidatePostsCache();
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

  const isAuthor = postToDelete.authorId === user.id;
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;
  
  if (!isAuthor && !isSuperAdmin) {
     throw new Error('Not authorized to delete this post.');
  }

  if (isSuperAdmin) {
    await prisma.$transaction([
      prisma.favoritePost.deleteMany({ where: { postId: id } }),
      prisma.review.deleteMany({ where: { postId: id } }),
      prisma.subtitle.deleteMany({ where: { postId: id } }),
      prisma.mediaLink.deleteMany({ where: { postId: id } }),
      prisma.post.delete({ where: { id } }),
    ]);

    await deleteUploadedFile(postToDelete.posterUrl);
  } else { // isAuthor but not Super Admin
    await prisma.post.update({
      where: { id },
      data: { status: 'PENDING_DELETION' },
    });
  }
  
  await invalidatePostsCache();
  revalidatePath('/');
}


export async function getPostsForAdmin(options: { page?: number; limit?: number, userId?: string, userRole?: string, status?: string | null, sortBy?: string } = {}) {
    const { page = 1, limit = 10, userId, userRole, status, sortBy = 'createdAt-desc' } = options;
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

  await invalidatePostsCache();
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

  await invalidatePostsCache(postId);
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

  await invalidatePostsCache(postId);
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
           series: {
              include: {
                _count: {
                  select: { posts: true }
                }
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
            title: {
                contains: query,
                mode: 'insensitive',
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

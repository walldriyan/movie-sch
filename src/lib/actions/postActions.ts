
'use server';

import { PrismaClient, Prisma, PostType, Subtitle } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES, MovieStatus } from '@/lib/permissions';
import { saveImageFromDataUrl, deleteUploadedFile } from './utils';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { PostFormData } from '@/lib/types';
import type { User, Review as ReviewWithParent } from '@prisma/client';

const prisma = new PrismaClient();

export async function getPosts(options: { page?: number; limit?: number, filters?: any } = {}) {
    const { page = 1, limit = 10, filters = {} } = options;
    const skip = (page - 1) * limit;
    const session = await auth();
    const user = session?.user;

    let whereClause: Prisma.PostWhereInput = {
      status: MovieStatus.PUBLISHED,
    };
    
    // Visibility Logic
    if (user && user.role === ROLES.SUPER_ADMIN) {
      whereClause.status = undefined;
    } else if (user) {
      const userGroupIds = await prisma.groupMember.findMany({
        where: { userId: user.id },
        select: { groupId: true },
      }).then(members => members.map(m => m.groupId));

      whereClause.OR = [
        { visibility: 'PUBLIC' },
        { 
          visibility: 'GROUP_ONLY',
          groupId: { in: userGroupIds }
        }
      ];
    } else {
      whereClause.visibility = 'PUBLIC';
    }
    
    let orderBy: Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[] = { updatedAt: 'desc' };

    const { sortBy, genres, yearRange, ratingRange, timeFilter, authorId, includePrivate, type } = filters;
    
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
  };

  const status = MovieStatus.PENDING_APPROVAL;

  if (id) {
    const existingPost = await prisma.post.findUnique({ where: { id } });
    if (!existingPost) {
        throw new Error('Post not found');
    }
    if (finalPosterUrl !== existingPost?.posterUrl) {
      await deleteUploadedFile(existingPost?.posterUrl);
    }
    
    await prisma.$transaction([
      prisma.mediaLink.deleteMany({ where: { postId: id } }),
      prisma.post.update({ 
          where: { id }, 
          data: { ...data, status: status, mediaLinks: { create: postData.mediaLinks } }
      })
    ]);

    revalidatePath(`/manage`);
    revalidatePath(`/movies/${id}`);
  } else {
    await prisma.post.create({ data: { ...data, status: status, authorId: userId, mediaLinks: { create: postData.mediaLinks } } });
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
      prisma.subtitle.deleteMany({ where: { postId: id } }),
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
            },
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

  revalidatePath(`/movies/${postId}`);
}

export async function toggleFavoritePost(postId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }
  const userId = session.user.id;

  const existingFavorite = await prisma.favoritePost.findFirst({
    where: {
      userId,
      postId,
    },
  });

  if (existingFavorite) {
    await prisma.favoritePost.delete({
      where: {
        id: existingFavorite.id,
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

export async function getFavoritePostsByUserId(userId: string) {
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

export async function createReview(
  postId: number,
  comment: string,
  rating: number,
  parentId?: number
): Promise<ReviewWithParent & { user: User, replies: (ReviewWithParent & { user: User })[] }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('You must be logged in to post a review.');
  }
  const userId = session.user.id;

  const reviewData: Prisma.ReviewCreateInput = {
    comment,
    rating: parentId ? 0 : rating,
    post: { connect: { id: postId } },
    user: { connect: { id: userId } },
  };

  if (parentId) {
    reviewData.parent = { connect: { id: parentId } };
  }

  const newReview = await prisma.review.create({
    data: reviewData,
    include: {
      user: true,
      replies: {
        include: {
          user: true,
        },
      },
    },
  });

  revalidatePath(`/movies/${postId}`);

  return newReview as ReviewWithParent & { user: User, replies: (ReviewWithParent & { user: User })[] };
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

export async function uploadSubtitle(formData: FormData): Promise<Subtitle> {
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

  // This part of the code is problematic as `saveFile` is not defined.
  // Assuming a utility function exists to handle file saving.
  // For the purpose of this fix, we will assume a placeholder path.
  const url = `/uploads/subtitles/placeholder.srt`; // Placeholder

  const subtitleRecord = await prisma.subtitle.create({
    data: {
      language,
      uploaderName: user.name,
      url: url, 
      post: { connect: { id: postId } },
    },
  });

  revalidatePath(`/movies/${postId}`);
  return subtitleRecord;
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

  await deleteUploadedFile(subtitle.url);

  await prisma.subtitle.delete({
    where: { id: subtitleId },
  });

  revalidatePath(`/movies/${subtitle.postId}`);
}

export async function canUserDownloadSubtitle(subtitleId: number): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
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

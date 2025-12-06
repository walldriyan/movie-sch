

'use server';

import type { User } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES, MovieStatus } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { saveImageFromDataUrl, deleteUploadedFile, invalidateUserGroupsCache } from './posts';
import { subDays } from 'date-fns';


export async function getUsers(options: { page?: number; limit?: number } = {}): Promise<User[]> {
  const { page, limit } = options;

  let queryOptions: any = {
    orderBy: { name: 'asc' },
  };

  if (page && limit) {
    queryOptions.skip = (page - 1) * limit;
    queryOptions.take = limit;
  }

  const users = await prisma.user.findMany(queryOptions);

  return users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
  })) as unknown as User[];
}

export async function getPostsByUserId(userId: string, includePrivate: boolean = false) {
  let where: any = {
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
      series: {
        include: {
          _count: {
            select: { posts: true }
          }
        }
      },
      _count: {
        select: {
          likedBy: true,
          reviews: true,
        }
      }
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
  status: string,
  dailyPostLimit: string | null
) {
  const session = await auth();
  if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Not authorized');
  }

  const limit = dailyPostLimit === null || dailyPostLimit.trim() === '' ? null : parseInt(dailyPostLimit, 10);
  if (dailyPostLimit !== null && dailyPostLimit.trim() !== '' && (isNaN(limit!) || limit! < 0)) {
    throw new Error("Invalid Daily Post Limit. It must be a non-negative number.");
  }


  await prisma.user.update({
    where: { id: userId },
    data: {
      role: role as any,
      permissionRequestStatus: status,
      dailyPostLimit: limit,
    },
  });

  await invalidateUserGroupsCache(userId);
  revalidatePath('/admin/users');
  revalidatePath(`/profile/${userId}`);
}

export async function getDashboardNotifications() {
  const session = await auth();
  const user = session?.user;
  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    return { pendingPosts: [], pendingUsers: [], unreadFeedback: [] };
  }

  let whereClause: any = { status: MovieStatus.PENDING_APPROVAL };
  if (user.role === ROLES.USER_ADMIN) {
    whereClause.authorId = user.id;
  }

  const pendingPostsPromise = prisma.post.findMany({
    where: whereClause,
    select: { id: true, title: true, author: { select: { name: true } } },
    orderBy: {
      createdAt: 'desc',
    },
  });

  let pendingUsersPromise: Promise<Partial<User>[]> = Promise.resolve([]);
  let unreadFeedbackPromise: Promise<any[]> = Promise.resolve([]);

  if (user.role === ROLES.SUPER_ADMIN) {
    pendingUsersPromise = prisma.user.findMany({
      where: { permissionRequestStatus: 'PENDING' },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: 'desc' },
    });

    unreadFeedbackPromise = prisma.feedback.findMany({
      where: { status: 'UNREAD' },
      select: { id: true, title: true, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  const [pendingPosts, pendingUsers, unreadFeedback] = await Promise.all([
    pendingPostsPromise,
    pendingUsersPromise,
    unreadFeedbackPromise
  ]);

  return { pendingPosts, pendingUsers, unreadFeedback };
}

export async function getPostCreationStatus() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    return { limit: 0, count: 0, remaining: 0 };
  }

  const userRecord = await prisma.user.findUnique({ where: { id: user.id } });
  if (!userRecord) {
    // Handle case where user exists in session but not in DB (stale session)
    console.warn(`[getPostCreationStatus] User record not found for ID: ${user.id}`);
    return { limit: 0, count: 0, remaining: 0 };
  }

  const defaultLimitSetting = await prisma.appSetting.findUnique({ where: { key: 'dailyPostLimit_default' } });
  const defaultLimit = defaultLimitSetting ? parseInt(defaultLimitSetting.value, 10) : 10;

  // User-specific limit overrides the default
  const postLimit = userRecord.dailyPostLimit ?? defaultLimit;

  let postCount = 0;
  if (postLimit > 0) { // No need to count if limit is unlimited
    const twentyFourHoursAgo = subDays(new Date(), 1);
    postCount = await prisma.post.count({
      where: {
        authorId: user.id,
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
    });
  }

  const remaining = postLimit > 0 ? postLimit - postCount : Infinity;

  return {
    limit: postLimit,
    count: postCount,
    remaining: remaining,
  };
}


export async function canUserAccessMicroPosts(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) {
    return false;
  }

  if (session.user.role === ROLES.SUPER_ADMIN) {
    return true;
  }

  const allowedGroupsSetting = await prisma.appSetting.findUnique({
    where: { key: 'microPostAllowedGroupIds' },
  });

  if (!allowedGroupsSetting?.value) {
    return false; // No groups are allowed
  }

  const allowedGroupIds = allowedGroupsSetting.value.split(',').filter(Boolean);
  if (allowedGroupIds.length === 0) {
    return false;
  }

  const userMembershipCount = await prisma.groupMember.count({
    where: {
      userId: session.user.id,
      status: 'ACTIVE',
      groupId: { in: allowedGroupIds },
    },
  });

  return userMembershipCount > 0;
}



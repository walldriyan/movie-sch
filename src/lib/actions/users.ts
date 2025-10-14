

'use server';

import type { User } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES, MovieStatus } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import { saveImageFromDataUrl, deleteUploadedFile } from './posts';


export async function getUsers(): Promise<User[]> {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  });
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
  status: string
) {
  const session = await auth();
  if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
    throw new Error('Not authorized');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      role: role as any,
      permissionRequestStatus: status,
    },
  });

  revalidatePath('/admin/users');
  revalidatePath(`/profile/${userId}`);
}

export async function getPendingApprovals() {
  const session = await auth();
  const user = session?.user;
  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    return { pendingPosts: [], pendingUsers: [] };
  }

  let whereClause: any = { status: MovieStatus.PENDING_APPROVAL };
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

  let pendingUsers: Partial<User>[] = [];
  if (user.role === ROLES.SUPER_ADMIN) {
    pendingUsers = await prisma.user.findMany({
      where: { permissionRequestStatus: 'PENDING' },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  return { pendingPosts, pendingUsers };
}

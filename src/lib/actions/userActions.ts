
'use server';

import { PrismaClient, User, Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { ROLES } from '@/lib/permissions';
import { saveImageFromDataUrl, deleteUploadedFile } from './utils';

const prisma = new PrismaClient();

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

export async function getPendingApprovals() {
  const session = await auth();
  const user = session?.user;
  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    return { pendingPosts: [], pendingUsers: [] };
  }
  
  const pendingPosts = await prisma.post.findMany({
    where: { status: 'PENDING_APPROVAL' },
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
      orderBy: { updatedAt: 'desc' },
    });
  }


  return { pendingPosts, pendingUsers };
}

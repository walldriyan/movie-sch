
'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { saveImageFromDataUrl, deleteUploadedFile } from './posts';
import { ROLES } from '../permissions';
import type { MicroPost as PrismaMicroPost } from '@prisma/client';
import { subDays } from 'date-fns';


const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export async function createMicroPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  const content = formData.get('content') as string;
  const categoriesStr = formData.get('categories') as string;
  const tagsStr = formData.get('tags') as string;
  const imageFile = formData.get('image') as File | null;
  
  const categories = categoriesStr ? categoriesStr.split(',').map(c => c.trim()).filter(Boolean) : [];
  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

  if (!content.trim()) {
    throw new Error('Content cannot be empty.');
  }

  let imageUrl: string | undefined = undefined;

  if (imageFile && imageFile.size > 0) {
      if (imageFile.size > MAX_FILE_SIZE) {
          throw new Error('Image size must be less than 1MB.');
      }
      const dataUrl = await imageFile.arrayBuffer().then(buffer =>
        `data:${imageFile.type};base64,${Buffer.from(buffer).toString('base64')}`
      );
      const savedPath = await saveImageFromDataUrl(dataUrl, 'microposts');
      if (savedPath) {
        imageUrl = savedPath;
      }
  }

  const categoryConnectOrCreate = categories.map(name => ({
    where: { name },
    create: { name },
  }));
  
  const tagConnectOrCreate = tags.map(name => ({
    where: { name },
    create: { name },
  }));

  const newPost = await prisma.microPost.create({
    data: {
      content,
      authorId: session.user.id,
      categories: {
        connectOrCreate: categoryConnectOrCreate,
      },
      tags: {
        connectOrCreate: tagConnectOrCreate,
      },
      images: imageUrl ? {
        create: { url: imageUrl }
      } : undefined,
    },
    include: {
        author: true,
        images: true,
        categories: true,
        tags: true,
        likes: true,
        _count: {
            select: {
                likes: true,
                comments: true,
            },
        },
    }
  });

  revalidatePath('/wall');
  return newPost;
}

export async function getAllCategories() {
    return prisma.category.findMany({
        select: { name: true },
        orderBy: { name: 'asc' }
    });
}

export async function getAllTags() {
    return prisma.tag.findMany({
        select: { name: true },
        orderBy: { name: 'asc' }
    });
}

export async function getMicroPosts() {
    const posts = await prisma.microPost.findMany({
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            author: true,
            images: true,
            categories: true,
            tags: true,
            likes: true, 
            _count: {
                select: {
                    likes: true,
                    comments: true,
                },
            },
        },
    });
    return posts;
}

export async function toggleMicroPostLike(postId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        throw new Error('Not authenticated');
    }

    const existingLike = await prisma.microPostLike.findUnique({
        where: {
            userId_microPostId: {
                userId,
                microPostId: postId,
            },
        },
    });

    if (existingLike) {
        await prisma.microPostLike.delete({
            where: {
                userId_microPostId: {
                    userId,
                    microPostId: postId,
                },
            },
        });
    } else {
        await prisma.microPostLike.create({
            data: {
                userId,
                microPostId: postId,
            },
        });
    }

    revalidatePath('/wall');
}


export async function deleteMicroPost(postId: string) {
    const session = await auth();
    const user = session?.user;
    if (!user) {
        throw new Error('Not authenticated');
    }

    const post = await prisma.microPost.findUnique({
        where: { id: postId },
        include: { images: true },
    });

    if (!post) {
        throw new Error('Post not found');
    }

    if (post.authorId !== user.id && user.role !== ROLES.SUPER_ADMIN) {
        throw new Error('Not authorized to delete this post');
    }
    
    // Delete associated images from storage first
    for (const image of post.images) {
        await deleteUploadedFile(image.url);
    }
    
    // Prisma will cascade delete likes, comments, images, etc.
    await prisma.microPost.delete({
        where: { id: postId },
    });

    revalidatePath('/wall');
}

export async function updateMicroPost(postId: string, formData: FormData) {
  const session = await auth();
  const user = session?.user;
  if (!user) {
    throw new Error('Not authenticated');
  }

  const post = await prisma.microPost.findUnique({
    where: { id: postId },
  });

  if (!post || post.authorId !== user.id) {
    throw new Error('Post not found or you are not the author');
  }
  
  const content = formData.get('content') as string;
  const categoriesStr = formData.get('categories') as string;
  const tagsStr = formData.get('tags') as string;
  
  const categories = categoriesStr ? categoriesStr.split(',').map(c => c.trim()).filter(Boolean) : [];
  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

  if (!content.trim()) {
    throw new Error('Content cannot be empty.');
  }
  
  const categoryConnectOrCreate = categories.map(name => ({
    where: { name },
    create: { name },
  }));
  
  const tagConnectOrCreate = tags.map(name => ({
    where: { name },
    create: { name },
  }));

  const updatedPost = await prisma.microPost.update({
    where: { id: postId },
    data: {
      content,
      categories: {
        set: [], // Disconnect all old categories
        connectOrCreate: categoryConnectOrCreate,
      },
      tags: {
        set: [], // Disconnect all old tags
        connectOrCreate: tagConnectOrCreate,
      },
    },
  });

  revalidatePath('/wall');
  return updatedPost;
}

export async function getMicroPostCreationStatus() {
    const session = await auth();
    const user = session?.user;

    if (!user) {
        throw new Error('Not authenticated');
    }

    const userRecord = await prisma.user.findUnique({ where: { id: user.id } });
    if (!userRecord) {
        throw new Error('User not found');
    }

    const defaultLimitSetting = await prisma.appSetting.findUnique({ where: { key: 'dailyPostLimit_default' }});
    const defaultLimit = defaultLimitSetting ? parseInt(defaultLimitSetting.value, 10) : 10;
    
    // User-specific limit overrides the default
    const postLimit = userRecord.dailyPostLimit ?? defaultLimit;

    let postCount = 0;
    if (postLimit > 0) { // No need to count if limit is unlimited
        const twentyFourHoursAgo = subDays(new Date(), 1);
        postCount = await prisma.microPost.count({
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

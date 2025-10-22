
'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { saveImageFromDataUrl } from './posts';

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
  
  const categories = categoriesStr ? categoriesStr.split(',') : [];
  const tags = tagsStr ? tagsStr.split(',') : [];

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
  });

  revalidatePath('/');
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

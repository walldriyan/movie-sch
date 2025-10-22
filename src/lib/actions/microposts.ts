
'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createMicroPost(content: string, categoryName?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  if (!content.trim()) {
    throw new Error('Content cannot be empty.');
  }

  let categoryConnect = {};
  if (categoryName && categoryName.trim()) {
      const category = await prisma.microPostCategory.upsert({
          where: { name: categoryName.trim() },
          update: {},
          create: { name: categoryName.trim() }
      });
      categoryConnect = { category: { connect: { id: category.id } } };
  }

  const newPost = await prisma.microPost.create({
    data: {
      content,
      authorId: session.user.id,
      ...categoryConnect,
    },
  });

  revalidatePath('/');
  return newPost;
}

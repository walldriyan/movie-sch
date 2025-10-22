
'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createMicroPost(content: string, tags: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authenticated');
  }

  if (!content.trim()) {
    throw new Error('Content cannot be empty.');
  }

  const newPost = await prisma.microPost.create({
    data: {
      content,
      authorId: session.user.id,
      tags: tags.map(tag => tag.trim()).filter(Boolean), // Clean up tags
    },
  });

  revalidatePath('/');
  return newPost;
}

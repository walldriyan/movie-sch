
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { Subtitle } from '@prisma/client';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, extname } from 'path';

async function deleteUploadedFile(filePath: string | null | undefined) {
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

  const subtitleRecord = await prisma.subtitle.create({
    data: {
      language,
      uploaderName: user.name,
      url: '', // Temporary
      post: { connect: { id: postId } },
      user: { connect: { id: user.id } },
    },
  });

  const fileExtension = extname(file.name);
  const filename = `${subtitleRecord.id}${fileExtension}`;
  const directory = join(process.cwd(), `public/uploads/subtitles`);
  await mkdir(directory, { recursive: true });
  const path = join(directory, filename);
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(path, buffer);
  
  const url = `/uploads/subtitles/${filename}`;

  const updatedSubtitle = await prisma.subtitle.update({
    where: { id: subtitleRecord.id },
    data: { url: url },
  });

  revalidatePath(`/movies/${postId}`);
  return updatedSubtitle;
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

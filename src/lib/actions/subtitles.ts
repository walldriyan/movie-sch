
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import prisma from '@/lib/prisma';
import type { Subtitle } from '@prisma/client';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join, extname } from 'path';
import { createClient } from '@supabase/supabase-js';
import { STORAGE_CONFIG } from '../storage-config';

async function deleteUploadedFile(filePath: string | null | undefined) {
  if (!filePath) return;

  if (STORAGE_CONFIG.provider === 'local') {
    if (!filePath.startsWith(STORAGE_CONFIG.publicUrlPrefix)) {
      return;
    }
    try {
      const relativePath = filePath.substring(STORAGE_CONFIG.publicUrlPrefix.length);
      const fullPath = join(process.cwd(), STORAGE_CONFIG.localRoot, relativePath);
      await unlink(fullPath);
    } catch (error) {
      console.error(`Failed to delete file: ${filePath}`, error);
    }
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

  let url = '';

  if (STORAGE_CONFIG.provider === 'local') {
    const directory = join(process.cwd(), STORAGE_CONFIG.localRoot, 'subtitles');
    await mkdir(directory, { recursive: true });
    const path = join(directory, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path, buffer);

    const prefix = STORAGE_CONFIG.publicUrlPrefix.replace(/\/$/, '');
    url = `${prefix}/subtitles/${filename}`;
  } else if (STORAGE_CONFIG.provider === 'supabase') {
    const supabase = createClient(STORAGE_CONFIG.supabase.url, STORAGE_CONFIG.supabase.anonKey);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.supabase.bucket)
      .upload(`subtitles/${filename}`, buffer, {
        contentType: 'text/vtt',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_CONFIG.supabase.bucket)
      .getPublicUrl(`subtitles/${filename}`);

    url = publicUrl;
  } else {
    // Placeholder for other providers
    console.warn('Storage provider not implemented:', STORAGE_CONFIG.provider);
  }

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

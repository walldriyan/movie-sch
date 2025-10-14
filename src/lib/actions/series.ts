
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import type { Series } from '@prisma/client';
import { MovieStatus } from '@/lib/permissions';

export async function getSeries(): Promise<Series[]> {
  const series = await prisma.series.findMany({
    orderBy: { title: 'asc' },
  });
  return series;
}

export async function createSeries(title: string): Promise<Series> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Not authorized: You must be logged in to create a series.');
  }

  const existingSeries = await prisma.series.findFirst({
    where: { 
      title: {
        equals: title,
      }
    },
  });

  if (existingSeries) {
    throw new Error(`A series with the title "${title}" already exists.`);
  }

  const newSeries = await prisma.series.create({
    data: {
      title,
      authorId: session.user.id,
    },
  });
  
  revalidatePath('/manage');
  return newSeries;
}

export async function getSeriesById(id: number): Promise<Series | null> {
  const series = await prisma.series.findUnique({
    where: { id },
  });
  return series;
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


export async function getSeriesByAuthorId(authorId: string, limit?: number) {
  const where = { authorId: authorId };
  
  const seriesQuery: any = {
    where,
    include: {
      _count: {
        select: { posts: true },
      },
      posts: {
        orderBy: {
          orderInSeries: 'asc',
        },
        include: {
          author: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  };
  
  if (limit) {
    seriesQuery.take = limit;
  }
  
  const series = await prisma.series.findMany(seriesQuery);
  
  const totalSeries = await prisma.series.count({ where });

  const processedSeries = series.map(s => ({
    ...s,
    posts: s.posts.map(p => ({
      ...p,
      genres: p.genres ? p.genres.split(',') : [],
    }))
  }))

  return { series: processedSeries, totalSeries };
}

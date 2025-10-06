
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Series } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { List } from 'lucide-react';

interface SeriesCardProps {
    series: Series & { _count: { posts: number }, posts: { posterUrl: string | null }[] };
}

export default function SeriesCard({ series }: SeriesCardProps) {
  const seriesImage = series.posts[0]?.posterUrl || PlaceHolderImages.find(p => p.id === 'movie-poster-placeholder')?.imageUrl;
  const totalPosts = series._count.posts;
  // This is a placeholder for watched posts count
  const watchedPosts = Math.floor(Math.random() * (totalPosts + 1)); 
  const progressPercentage = totalPosts > 0 ? (watchedPosts / totalPosts) * 100 : 0;

  return (
    <Link href={`/series/${series.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/30 group-hover:-translate-y-1 h-full flex flex-col">
        <div className="aspect-video relative">
          {seriesImage && (
            <Image
              src={seriesImage}
              alt={`Poster for ${series.title}`}
              fill
              className="object-cover"
            />
          )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        <CardHeader className="flex-grow">
          <CardTitle className="group-hover:text-primary flex items-center gap-2">
            <List className="h-5 w-5" />
            {series.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{watchedPosts} / {totalPosts}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>
    </Link>
  );
}

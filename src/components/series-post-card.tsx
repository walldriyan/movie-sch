
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PlayCircle, CheckCircle } from 'lucide-react';

interface SeriesPostCardProps {
  post: Post;
  seriesId: number;
  isActive: boolean;
}

export default function SeriesPostCard({
  post,
  seriesId,
  isActive,
}: SeriesPostCardProps) {
  const postImageUrl =
    post.posterUrl ||
    PlaceHolderImages.find(
      (p) => p.id === 'movie-poster-placeholder'
    )?.imageUrl;

  return (
    <Link
      href={`/series/${seriesId}?post=${post.id}`}
      className={cn(
        'flex items-center gap-4 p-2 rounded-lg transition-colors',
        isActive
          ? 'bg-primary/10 border-primary/50'
          : 'hover:bg-muted/50'
      )}
    >
      <div className="relative w-24 h-14 flex-shrink-0 overflow-hidden rounded-md">
        {postImageUrl && (
          <Image
            src={postImageUrl}
            alt={post.title}
            fill
            className="object-cover"
          />
        )}
      </div>
      <div className="flex-grow overflow-hidden">
        <p
          className={cn(
            'text-sm font-semibold truncate',
            isActive ? 'text-primary' : 'text-foreground'
          )}
        >
          Part {post.orderInSeries}: {post.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{post.duration}</p>
      </div>
      <div className="flex-shrink-0">
        {isActive ? (
          <PlayCircle className="w-6 h-6 text-primary" />
        ) : (
          <CheckCircle className="w-6 h-6 text-muted-foreground/50" />
        )}
      </div>
    </Link>
  );
}

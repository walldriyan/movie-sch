
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/types';
import { Play, CheckCircle2, Lock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Session } from 'next-auth';

interface SeriesPostCardProps {
  post: Post;
  seriesId: number;
  isActive: boolean;
  isLocked: boolean;
  isPassed?: boolean;
  session: Session | null;
}

export default function SeriesPostCard({
  post,
  seriesId,
  isActive,
  isLocked,
  isPassed = false,
  session,
}: SeriesPostCardProps) {
  const { toast } = useToast();
  const [imgError, setImgError] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isLocked) {
      e.preventDefault();
      toast({
        variant: 'destructive',
        title: 'Post Locked',
        description: 'You must pass the previous exam to unlock this post.',
      });
    }
  };

  const hasImage = post.posterUrl && post.posterUrl.trim() !== '' && !imgError;

  return (
    <Link
      href={`/series/${seriesId}?post=${post.id}`}
      className={cn(
        'flex items-center gap-3 p-2 rounded-xl transition-all duration-200 group',
        isActive
          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 border border-purple-500/30'
          : 'hover:bg-white/5 border border-transparent hover:border-white/10',
        isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      )}
      aria-disabled={isLocked}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
        {hasImage ? (
          <Image
            src={post.posterUrl!}
            alt={post.title}
            fill
            sizes="64px"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImgError(true)}
          />
        ) : (
          // Gradient placeholder for broken/missing images
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-gray-900 flex items-center justify-center">
            <span className="text-white/40 text-xs font-bold">{post.orderInSeries}</span>
          </div>
        )}

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
        )}

        {/* Status indicator */}
        {!isLocked && (
          <div className={cn(
            "absolute bottom-1 right-1 h-5 w-5 rounded-full flex items-center justify-center",
            isActive
              ? "bg-purple-500/90"
              : isPassed
                ? "bg-green-500/90"
                : "bg-white/20 backdrop-blur-sm"
          )}>
            {isActive ? (
              <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />
            ) : isPassed ? (
              <CheckCircle2 className="w-3 h-3 text-white" />
            ) : (
              <Eye className="w-2.5 h-2.5 text-white/70" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-grow overflow-hidden min-w-0">
        <p className={cn(
          'text-sm font-medium truncate transition-colors',
          isActive ? 'text-purple-300' : 'text-white group-hover:text-white/90'
        )}>
          Part {post.orderInSeries}
        </p>
        <p className={cn(
          'text-xs truncate mt-0.5',
          isActive ? 'text-purple-300/70' : 'text-white/50'
        )}>
          {post.title}
        </p>
        {post.duration && (
          <p className="text-[10px] text-white/30 mt-1">{post.duration}</p>
        )}
      </div>

      {/* Locked badge */}
      {isLocked && (
        <div className="flex-shrink-0 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-medium">
          Locked
        </div>
      )}
    </Link>
  );
}

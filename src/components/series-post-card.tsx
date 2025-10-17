

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PlayCircle, CheckCircle, Lock } from 'lucide-react';
import { useMemo } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ROLES } from '@/lib/permissions';

interface SeriesPostCardProps {
  post: Post;
  seriesId: number;
  isActive: boolean;
  isPassed: boolean;
}

export default function SeriesPostCard({
  post,
  seriesId,
  isActive,
  isPassed,
}: SeriesPostCardProps) {
  const currentUser = useCurrentUser();
  const postImageUrl =
    post.posterUrl ||
    PlaceHolderImages.find(
      (p) => p.id === 'movie-poster-placeholder'
    )?.imageUrl;

  const isLocked = useMemo(() => {
    // If it's not locked by default, it's always unlocked
    if (post.isLockedByDefault === false) return false;
    
    // Super admins and the author can always access
    if (currentUser?.role === ROLES.SUPER_ADMIN || currentUser?.id === post.authorId) return false;
    
    // If it is locked by default, check if the user has passed the prerequisite
    return !isPassed;

  }, [post, currentUser, isPassed]);


  const Wrapper = isLocked ? 'div' : Link;
  const linkProps = isLocked ? {} : { href: `/series/${seriesId}?post=${post.id}` };

  return (
    <Wrapper
      {...linkProps}
      className={cn(
        'flex items-center gap-4 p-2 rounded-lg transition-colors',
        isActive
          ? 'bg-primary/10 border-primary/50'
          : 'hover:bg-muted/50',
        isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      )}
      aria-disabled={isLocked}
      onClick={(e) => {
        if(isLocked) e.preventDefault();
      }}
    >
      <div className="relative w-24 h-14 flex-shrink-0 overflow-hidden rounded-md">
        {postImageUrl && (
          <Image
            src={postImageUrl}
            alt={post.title}
            fill
            sizes="100px"
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
        {isLocked ? (
          <Lock className="w-6 h-6 text-yellow-400" />
        ) : isActive ? (
          <PlayCircle className="w-6 h-6 text-primary" />
        ) : (
          <CheckCircle className="w-6 h-6 text-muted-foreground/50" />
        )}
      </div>
    </Wrapper>
  );
}

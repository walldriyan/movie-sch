
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
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
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

  return (
    <Link
      href={`/series/${seriesId}?post=${post.id}`}
      className={cn(
        'flex items-center gap-4 p-2 rounded-lg transition-colors',
        isActive
          ? 'bg-primary/10 border-primary/50'
          : 'hover:bg-muted/50',
        isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
      )}
      aria-disabled={isLocked}
      onClick={handleClick}
    >
      <div className="relative w-24 h-14 flex-shrink-0 overflow-hidden rounded-md group">
        {postImageUrl && (
          <Image
            src={postImageUrl}
            alt={post.title}
            fill
            sizes="100px"
            className="object-cover"
          />
        )}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Lock className="w-6 h-6 text-white" />
          </div>
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
         {!isLocked && (
           isActive ? (
              <PlayCircle className="w-6 h-6 text-primary" />
           ) : (
              <CheckCircle className="w-6 h-6 text-muted-foreground/50" />
           )
         )}
      </div>
    </Link>
  );
}

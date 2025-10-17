
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
  
  const isLocked = useMemo(() => {
    // If the user is a super admin or the author of the post, it's never locked.
    if (currentUser?.role === ROLES.SUPER_ADMIN || currentUser?.id === post.authorId) {
        return false;
    }
    // If the post is not locked by default, it's never locked.
    if (post.isLockedByDefault === false) {
        return false;
    }
    // Otherwise, the lock status depends on whether the prerequisite is passed.
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

  const postImageUrl =
    post.posterUrl ||
    PlaceHolderImages.find(
      (p) => p.id === 'movie-poster-placeholder'
    )?.imageUrl;

  const StatusIcon = () => {
    if (isLocked) return <Lock className="w-4 h-4 text-white" />;
    if (isActive) return <PlayCircle className="w-4 h-4 text-primary" />;
    return <CheckCircle className="w-4 h-4 text-muted-foreground/80" />;
  };


  return (
    <Link
      href={`/series/${seriesId}?post=${post.id}`}
      className={cn(
        'flex items-center gap-4 p-2 rounded-lg transition-colors group',
        isActive
          ? 'bg-primary/10'
          : 'hover:bg-muted/50',
        isLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
      )}
      aria-disabled={isLocked}
      onClick={handleClick}
    >
      <div className="relative w-24 h-14 flex-shrink-0 overflow-hidden rounded-md">
        {postImageUrl && (
          <Image
            src={postImageUrl}
            alt={post.title}
            fill
            sizes="100px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div 
          className="absolute bottom-1 right-1 h-6 w-6 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <StatusIcon />
        </div>
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
    </Link>
  );
}

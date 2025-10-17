
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
    // If the post is not configured to be locked by default, it's always open.
    if (!post.isLockedByDefault) {
      return false;
    }

    // For public/unauthenticated users, if it's locked by default, it's locked.
    if (!currentUser) {
      return true;
    }

    // For logged-in users, check for exceptions (Admin/Author).
    if (currentUser.role === ROLES.SUPER_ADMIN || currentUser.id === post.authorId) {
        return false;
    }
    
    // For regular logged-in users, it's locked if the prerequisite is not passed.
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
    if (isLocked) return <Lock className="w-4 h-4 text-yellow-400" />;
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
        {isLocked && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                 <Lock className="w-5 h-5 text-white" />
            </div>
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

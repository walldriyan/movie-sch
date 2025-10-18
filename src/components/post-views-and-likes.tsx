
'use client';

import type { Post } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, ThumbsUp } from 'lucide-react';

export default function PostViewsAndLikes({ post }: { post: Post }) {
  const likers = post.likedBy || [];
  const displayLikers = likers.slice(0, 3);
  const remainingLikersCount = (post._count?.likedBy || 0) > 3 ? (post._count?.likedBy || 0) - 3 : 0;
  const hasLikesOrViews = (post._count?.likedBy || 0) > 0 || post.viewCount > 0;

  if (!hasLikesOrViews) return null;

  return (
    <div className="relative flex items-center h-12">
        <div className="flex -space-x-4">
          {displayLikers.map((liker, index) => (
            <Avatar key={liker.id} className="h-12 w-12 border-2 border-background" style={{ zIndex: displayLikers.length - index }}>
              <AvatarImage src={liker.image || ''} alt={liker.name || 'user'} />
              <AvatarFallback>{liker.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          ))}
          {remainingLikersCount > 0 && (
            <Avatar className="h-12 w-12 border-2 border-background" style={{ zIndex: 0 }}>
              <AvatarFallback>+{remainingLikersCount}</AvatarFallback>
            </Avatar>
          )}

           {/* View Count Avatar - now rendered after user avatars */}
            <div className="relative z-[-1] flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-muted">
                 <div className="flex flex-col items-center gap-0.5 text-xs font-bold text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span className="text-[10px]">{post.viewCount.toLocaleString()}</span>
                </div>
            </div>

            {/* Like Count Avatar - now rendered last to be at the bottom of the stack */}
           <div className="relative z-[-2] flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-muted">
                <div className="flex flex-col items-center gap-0.5 text-xs font-bold text-muted-foreground">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-[10px]">{post._count?.likedBy || 0}</span>
                </div>
            </div>
        </div>
    </div>
  );
};


'use client';

import type { Post } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from './ui/separator';
import { Eye, ThumbsUp } from 'lucide-react';

export default function PostViewsAndLikes({ post }: { post: Post }) {
  const likers = post.likedBy || [];
  if (likers.length === 0) return null;

  const displayLikers = likers.slice(0, 5);
  const remainingLikersCount = (post._count?.likedBy || 0) > 5 ? (post._count?.likedBy || 0) - 5 : 0;

  return (
    <div className="relative flex items-center justify-center p-8">
        <div className="flex -space-x-4">
          {displayLikers.map(liker => (
            <Avatar key={liker.id} className="h-12 w-12 border-2 border-background">
              <AvatarImage src={liker.image || ''} alt={liker.name || 'user'} />
              <AvatarFallback>{liker.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          ))}
          {remainingLikersCount > 0 && (
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarFallback>+{remainingLikersCount}</AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 right-0 flex items-center gap-4 bg-black/30 text-white backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="font-bold text-sm">{post.viewCount.toLocaleString()}</span>
            </div>
            <Separator orientation="vertical" className="h-4 bg-white/30" />
            <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                <span className="font-bold text-sm">{post._count?.likedBy || 0}</span>
            </div>
        </div>
    </div>
  );
};

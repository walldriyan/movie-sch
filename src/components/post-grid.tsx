
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Star, MessageCircle, MoreHorizontal, ThumbsUp } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import type { Post, PostType as PostTypeEnum } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import ClientRelativeDate from './client-relative-date';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PostGridProps {
  posts: Post[];
}

function PostCard({ post }: { post: Post }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const postImageUrl =
    post.posterUrl ||
    PlaceHolderImages.find(
      (p) => p.id === 'movie-poster-placeholder'
    )?.imageUrl;
  
  const authorAvatarUrl = post.author?.image || PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  const plainDescription = post.description.replace(/<[^>]+>/g, '');

  return (
    <li className="relative flex gap-4 pb-8">
        <div className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-border" />
        <div className="relative flex-shrink-0">
            <Avatar>
                {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={post.author?.name || 'Author'} />}
                <AvatarFallback>{post.author?.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
            </Avatar>
        </div>
        <div className="flex-grow space-y-3">
            <div className="flex items-center gap-2 text-sm">
                <Link href={`/profile/${post.author?.id}`} className="font-semibold text-foreground hover:text-primary">
                    {post.author?.name}
                </Link>
                <span className="text-muted-foreground">posted an update</span>
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="text-xs text-muted-foreground ml-auto">
                            <ClientRelativeDate date={new Date(post.updatedAt)} />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{new Date(post.updatedAt).toLocaleString()}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                {postImageUrl && (
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                      <Image
                          src={postImageUrl}
                          alt={post.title}
                          fill
                          className="object-cover"
                      />
                  </div>
                )}
                 <div className="p-3">
                    <Link href={`/movies/${post.id}`} className="group block">
                        <h2 className="font-serif text-lg font-bold leading-snug group-hover:text-primary transition-colors">
                            {post.title}
                        </h2>
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                      {plainDescription}
                    </p>
                    <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                            {post.imdbRating && (
                                 <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400" />
                                    <span>{post.imdbRating?.toFixed(1)}</span>
                                </div>
                            )}
                            {post.duration && (
                                 <span>{post.duration}</span>
                            )}
                        </div>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <ThumbsUp className="w-4 h-4" />
                                <span>{post._count?.likedBy || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post._count?.reviews || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </li>
  );
}

export default function PostGrid({ posts }: PostGridProps) {
  return (
    <TooltipProvider>
      <ul>
        {posts.map((post) => {
          return (
            <PostCard
              key={post.id}
              post={post as Post}
            />
          );
        })}
      </ul>
    </TooltipProvider>
  );
}

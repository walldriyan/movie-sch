
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Play, Clapperboard, Tv, Folder, List, Star, ThumbsUp, MessageCircle, Heart } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import type { Post as Movie, Series } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ClientRelativeDate from './client-relative-date';

interface PostGridProps {
  movies: Movie[];
}

function CategoryIcon({ type }: { type: Movie['type'] }) {
  const getCategory = () => {
    switch (type) {
      case 'MOVIE':
        return { icon: <Clapperboard className="w-4 h-4" />, label: 'Movie', color: 'bg-blue-900/50' };
      case 'TV_SERIES':
        return { icon: <Tv className="w-4 h-4" />, label: 'TV Series', color: 'bg-green-900/50' };
      default:
        return { icon: <Folder className="w-4 h-4" />, label: 'Other', color: 'bg-gray-900/50' };
    }
  };

  const { icon, label, color } = getCategory();

  return (
    <div className={cn(
      "absolute top-2 right-2 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm",
      color
    )}>
      {icon}
      <span className='hidden sm:inline'>{label}</span>
    </div>
  );
}

function PostCard({ post }: { post: Movie }) {
  const postImageUrl =
    post.posterUrl ||
    PlaceHolderImages.find(
      (p) => p.id === 'movie-poster-placeholder'
    )?.imageUrl;
  
  const authorAvatarUrl = post.author?.image || PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  const plainDescription = post.description.replace(/<[^>]+>/g, '');
  
  const likers = post.likedBy || [];
  const totalLikes = post._count?.likedBy || 0;
  const displayLikers = likers.slice(0, 5);
  const remainingLikes = totalLikes - displayLikers.length;

  return (
    <li className="relative flex flex-col gap-4 pb-8">
        {/* Timeline line */}
        <div className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-border" />
        
        {/* Activity Header */}
        <div className="relative flex-shrink-0 flex items-center gap-3">
             <Link href={`/profile/${post.author?.id}`}>
                <Avatar>
                    {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={post.author?.name || 'Author'} />}
                    <AvatarFallback>{post.author?.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                </Avatar>
            </Link>
             <div className="flex items-center gap-2 text-sm">
                <Link href={`/profile/${post.author?.id}`} className="font-semibold text-foreground hover:text-primary">
                    {post.author?.name}
                </Link>
                <span className="text-muted-foreground">posted an update</span>
            </div>
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
        
        {/* Content Card */}
        <div className="pl-12 flex-grow space-y-3">
             <div className="rounded-lg border bg-card text-card-foreground shadow-sm group">
                {postImageUrl && (
                  <div className="aspect-[16/9] relative overflow-hidden rounded-t-lg shadow-md max-h-[310px] ">
                      <Image
                          src={postImageUrl}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 90vw, 800px"
                          className="object-cover"
                      />
                  </div>
                )}
                 <div className="p-3">
                    <Link href={`/movies/${post.id}`} className="group/link block">
                        <h2 className="font-serif text-lg font-bold leading-snug group-hover/link:text-primary transition-colors">
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
             {totalLikes > 0 && (
                <div className="mt-4 flex items-center gap-3 border-t pt-3">
                   <div className="flex items-center -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
                            <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
                        </div>
                        {displayLikers.map(liker => (
                            <Avatar key={liker.id} className="h-7 w-7 border-2 border-background">
                                <AvatarImage src={liker.image || ''} alt={liker.name || 'user'} />
                                <AvatarFallback>{liker.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {displayLikers[0]?.name}
                        {remainingLikes > 0 && ` and ${remainingLikes} others liked this.`}
                        {remainingLikes === 0 && ' liked this.'}
                    </p>
                </div>
            )}
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
              post={post as Movie}
            />
          );
        })}
      </ul>
    </TooltipProvider>
  );
}

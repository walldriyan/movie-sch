

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Play, Clapperboard, Tv, Folder } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import type { Post } from '@/lib/types';
import { PostType } from '@/lib/types';
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

function CategoryIcon({ type }: { type: PostType }) {
  const getCategory = () => {
    switch (type) {
      case PostType.MOVIE:
        return { icon: <Clapperboard className="w-4 h-4" />, label: 'Movie', color: 'bg-blue-900/50' };
      case PostType.TV_SERIES:
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


function PostCard({ post, index }: { post: Post; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const postImageUrl =
    post.posterUrl ||
    PlaceHolderImages.find(
      (p) => p.id === 'movie-poster-placeholder'
    )?.imageUrl;
  
  const authorAvatarUrl = post.author?.image || PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  const isFirst = index === 0;

  return (
    <div
      className={cn(
        'group relative min-h-[152px]',
        isFirst ? 'md:col-span-2 md:row-span-2' : 
        (index % 5 === 1 ? 'md:row-span-2' : 'md:col-span-1')
      )}
    >
        <div className="mb-2 flex items-center space-x-2 text-xs">
             <Link href={`/profile/${post.author?.id}`} className="flex items-center gap-2 group/author">
                <Avatar className="h-5 w-5">
                    {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={post.author?.name || 'Author'} />}
                    <AvatarFallback>{post.author?.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground/80 group-hover/author:text-primary truncate">
                    {post.author?.name}
                </span>
            </Link>
             <span className='text-muted-foreground'>&middot;</span>
             <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <ClientRelativeDate date={new Date(post.updatedAt)} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{new Date(post.updatedAt).toLocaleString()}</p>
                </TooltipContent>
            </Tooltip>
        </div>
        <Link
          href={`/movies/${post.id}`}
          key={post.id}
          className={cn(
            'relative block aspect-video overflow-hidden rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] cursor-pointer bg-[#0b0d0f] group h-full'
          )}
        >
          {!imageLoaded && <Skeleton className="absolute inset-0" />}
          {postImageUrl && (
            <Image
              src={postImageUrl}
              alt={post.title}
              fill
              className={cn(
                'object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 top-2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
         
          {isFirst && <div className="absolute inset-0 backdrop-blur-sm mask-gradient bg-black/20" />}

          <CategoryIcon type={post.type} />

          <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
            <div className="flex items-end justify-between">
              <div>
                <h3 className={cn("font-bold", isFirst ? "text-lg md:text-xl" : "text-sm md:text-base")}>
                  {post.title}
                </h3>
                {(isFirst) && (
                  <div
                    className="text-white/70 text-xs md:text-sm mt-1 line-clamp-2"
                     dangerouslySetInnerHTML={{ __html: post.description }}
                  />
                )}
              </div>
                <Avatar className="h-10 w-10 border-2 border-background flex-shrink-0">
                    {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={post.author?.name || 'Author'} />}
                    <AvatarFallback>{post.author?.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                </Avatar>
            </div>
          </div>
        </Link>
    </div>
  );
}

export default function PostGrid({ posts }: PostGridProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:auto-rows-min gap-x-4 gap-y-8">
        {posts.map((post, index) => {
          return (
            <PostCard
              key={post.id}
              post={post as Post}
              index={index}
            />
          );
        })}
      </div>
    </TooltipProvider>
  );
}

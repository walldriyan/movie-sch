

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Play, Clapperboard, Tv, Folder } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import type { Post } from '@/lib/types';
import { PostType } from '@/lib/types';

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
      "absolute top-2 right-1 z-20 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm",
      color
    )}>
      {icon}
      <span>{label}</span>
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

  const isFirst = index === 0;

  return (
    <Link
      href={`/movies/${post.id}`}
      key={post.id}
      className={cn(
        'relative block overflow-hidden rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] cursor-pointer bg-[#0b0d0f] group min-h-[152px] md:min-h-0',
        isFirst ? 'col-span-2 row-span-2' : 'col-span-1',
        isFirst ? 'md:col-span-2 md:row-span-2' : 
        (index % 5 === 1 ? 'md:row-span-2' : 'md:col-span-1')
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
     


      
      {/* Blur only on the first card */}
      {isFirst && <div className="absolute inset-0 backdrop-blur-sm mask-gradient bg-black/20" />}

      <CategoryIcon type={post.type} />

      <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
        <div className="flex items-end justify-between">
          <div>
            <h3 className={cn("font-bold", isFirst ? "text-lg md:text-xl" : "text-xs md:text-sm")}>
              {post.title}
            </h3>
            {(isFirst) && (
              <span className="text-white/70 text-xs md:text-sm mt-1 line-clamp-2">
                {post.description.replace(/<[^>]*>?/gm, '')}
              </span>
            )}
          </div>
          <div className="ml-2 p-3 rounded-full bg-primary/80 group-hover:bg-primary transition-colors flex-shrink-0">
            <Play className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PostGrid({ posts }: PostGridProps) {
  const patternLogic = (index: number) => {
    // This logic is for md screens and up
    const i = index % 5;
    if (i === 0) return 'md:col-span-2 md:row-span-2'; // Large
    if (i === 1) return 'md:row-span-2'; // Medium
    return ''; // Small
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 md:auto-rows-[152px] gap-4">
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
  );
}

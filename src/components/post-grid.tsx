
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Clapperboard, Tv, Folder, Star } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Separator } from './ui/separator';

interface PostGridProps {
  posts: Post[];
}

function CategoryIcon({ type }: { type: PostType }) {
  const getCategory = () => {
    switch (type) {
      case PostType.MOVIE:
        return { icon: <Clapperboard className="w-4 h-4" />, label: 'Movie', color: 'text-blue-400' };
      case PostType.TV_SERIES:
        return { icon: <Tv className="w-4 h-4" />, label: 'TV Series', color: 'text-green-400' };
      default:
        return { icon: <Folder className="w-4 h-4" />, label: 'Other', color: 'text-gray-400' };
    }
  };

  const { icon, label, color } = getCategory();

  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-semibold", color)}>
      {icon}
      <span>{label}</span>
    </div>
  );
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
    <Card className="overflow-hidden">
        <CardHeader className="p-4">
             <div className="flex items-center space-x-3 text-sm">
                <Link href={`/profile/${post.author?.id}`} className="flex items-center gap-3 group/author">
                    <Avatar className="h-10 w-10">
                        {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={post.author?.name || 'Author'} />}
                        <AvatarFallback>{post.author?.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-foreground group-hover/author:text-primary">
                            {post.author?.name}
                        </p>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="text-xs">
                                    <ClientRelativeDate date={new Date(post.updatedAt)} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{new Date(post.updatedAt).toLocaleString()}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </Link>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <Link href={`/movies/${post.id}`} className="group block mb-4">
                <h2 className="font-serif text-2xl font-bold leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                </h2>
            </Link>

             {postImageUrl && (
                <Link href={`/movies/${post.id}`} className="block aspect-video relative overflow-hidden rounded-lg mt-4">
                    <Image
                        src={postImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover"
                    />
                </Link>
            )}

            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                    <CategoryIcon type={post.type} />
                    {post.imdbRating && (
                         <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span>{post.imdbRating?.toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
  );
}

export default function PostGrid({ posts }: PostGridProps) {
  return (
    <TooltipProvider>
      <div className="space-y-8">
        {posts.map((post) => {
          return (
            <PostCard
              key={post.id}
              post={post as Post}
            />
          );
        })}
      </div>
    </TooltipProvider>
  );
}

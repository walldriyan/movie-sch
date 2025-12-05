
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Play, Clapperboard, Tv, Folder, List, Lock } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import type { Post as Movie, Series } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import DOMPurify from 'isomorphic-dompurify';

interface MovieGridProps {
  posts: Movie[];
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

function MovieCard({ movie, index }: { movie: Movie; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sanitizedDescription = DOMPurify.sanitize(movie.description);

  const movieImageUrl =
    movie.posterUrl ||
    PlaceHolderImages.find(
      (p) => p.id === 'movie-poster-placeholder'
    )?.imageUrl;

  const authorAvatarUrl = movie.author?.image || PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  const series = movie.series as Series | null;

  return (
    <div
      key={movie.id}
      className="relative block overflow-hidden rounded-lg bg-card border border-border cursor-pointer group transition-all hover:border-muted-foreground/30"
    >
      <Link
        href={`/movies/${movie.id}`}
        className="block h-full w-full"
        aria-label={movie.title}
      >
        {/* Image Container */}
        <div className="relative aspect-[2/3] overflow-hidden">
          {!imageLoaded && <Skeleton className="absolute inset-0" />}
          {movieImageUrl && (
            <Image
              src={movieImageUrl}
              alt={movie.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={cn(
                'object-cover transition-transform duration-300 group-hover:scale-105',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              priority={index < 4}
              quality={75}
            />
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* Lock badge */}
          {movie.isLockedByDefault && (
            <div className="absolute top-2 right-2 z-10">
              <div className="flex items-center gap-1 bg-secondary/90 backdrop-blur-sm px-2 py-1 rounded text-xs">
                <Lock className="h-3 w-3" />
              </div>
            </div>
          )}

          {/* Type badge */}
          {mounted && (
            <div className="absolute top-2 left-2 z-10">
              <div className="flex items-center gap-1 bg-secondary/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground">
                {movie.type === 'MOVIE' ? <Clapperboard className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                <span className="hidden sm:inline">{movie.type === 'MOVIE' ? 'Movie' : 'Series'}</span>
              </div>
            </div>
          )}

          {/* Series count */}
          {mounted && series && series?._count?.posts > 0 && (
            <div className="absolute bottom-2 left-2 z-10">
              <div className="flex items-center gap-1 bg-secondary/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground">
                <List className="h-3 w-3" />
                <span>{series._count.posts}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <h3 className="font-medium text-sm line-clamp-1 text-foreground">
            {movie.title}
          </h3>
          <div
            className="text-xs text-muted-foreground line-clamp-2"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />

          {/* Author */}
          <div className="flex items-center gap-2 pt-1">
            <Avatar className="h-5 w-5">
              {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={movie.author.name || 'Author'} />}
              <AvatarFallback className="text-[10px]">{movie.author.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate">{movie.author.name}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function PostGrid({ posts }: MovieGridProps) {
  if (!posts) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {posts.map((movie, index) => {
        return (
          <MovieCard
            key={movie.id}
            movie={movie as Movie}
            index={index}
          />
        );
      })}
    </div>
  );
}

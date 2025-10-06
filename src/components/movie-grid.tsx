
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Play, Clapperboard, Tv, Folder, List } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import type { Post as Movie, Series } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

interface MovieGridProps {
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

function MovieCard({ movie, index }: { movie: Movie; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const movieImageUrl =
    movie.posterUrl ||
    PlaceHolderImages.find(
      (p) => p.id === 'movie-poster-placeholder'
    )?.imageUrl;

  const authorAvatarUrl = movie.author?.image || PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  const isFirst = index === 0;
  const series = movie.series as Series | null;

  return (
    <div
      key={movie.id}
      className={cn(
        'relative block overflow-hidden rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] cursor-pointer bg-[#0b0d0f] group min-h-[152px] md:min-h-0',
        isFirst ? 'md:col-span-2 md:row-span-2' : 
        (index % 5 === 1 ? 'md:row-span-2' : 'md:col-span-1')
      )}
    >
      <Link
        href={`/movies/${movie.id}`}
        className="block h-full w-full"
        aria-label={movie.title}
      >
        {!imageLoaded && <Skeleton className="absolute inset-0" />}
        {movieImageUrl && (
          <Image
            src={movieImageUrl}
            alt={movie.title}
            fill
            className={cn(
              'object-cover rounded-xl transition-transform duration-300 group-hover:scale-105',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 top-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
        
        {isFirst && <div className="absolute inset-0 backdrop-blur-sm mask-gradient bg-black/20" />}

        <CategoryIcon type={movie.type} />

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10 flex items-end justify-between">
          <div className="[text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
            <h3 className={cn("font-bold", isFirst ? "text-lg md:text-xl" : "text-sm md:text-base")}>
              {movie.title}
            </h3>
            <div
              className="text-white/70 text-xs md:text-sm mt-1 line-clamp-2 [&_img]:hidden"
              dangerouslySetInnerHTML={{ __html: movie.description }}
            />
          </div>
          <Avatar className="h-10 w-10 border-2 border-background flex-shrink-0 ml-4">
            {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={movie.author.name || 'Author'} />}
            <AvatarFallback>{movie.author.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
          </Avatar>
        </div>
      </Link>
      {series && series._count && series._count.posts > 0 && (
          <Button asChild size="sm" variant="outline" className="absolute bottom-4 left-4 z-20 h-7 rounded-full bg-black/30 backdrop-blur-sm border-white/20 hover:bg-white/20">
              <Link href={`/series/${series.id}`} onClick={(e) => e.stopPropagation()}>
                  <List className="h-3 w-3" />
                  <span>{series._count.posts}</span>
              </Link>
          </Button>
      )}
    </div>
  );
}

export default function MovieGrid({ movies }: MovieGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 md:auto-rows-[152px] gap-4">
      {movies.map((movie, index) => {
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

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Play } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import type { Movie } from '@/lib/types';

interface MovieGridProps {
  movies: Movie[];
}

function MovieCard({ movie, patternIndex }: { movie: Movie; patternIndex: number }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const movieImageUrl =
    movie.posterUrl ||
    PlaceHolderImages.find(
      (p) => p.id === 'movie-poster-placeholder'
    )?.imageUrl;

  const isLarge = patternIndex === 0;
  const isMedium = patternIndex === 1;

  return (
    <Link
      href={`/movies/${movie.id}`}
      key={movie.id}
      className={cn(
        'relative block overflow-hidden rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] cursor-pointer bg-[#0b0d0f]',
        isLarge && 'md:col-span-2 md:row-span-2',
        isMedium && 'md:row-span-2'
      )}
    >
      {!imageLoaded && <Skeleton className="absolute inset-0" />}
      {movieImageUrl && (
        <Image
          src={movieImageUrl}
          alt={movie.title}
          fill
          className={cn(
            'object-cover rounded-xl transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 top-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
      <div className="absolute inset-0 backdrop-blur-sm mask-gradient bg-black/20" />

      <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
        <div className="flex items-end justify-between">
          <div>
            {isLarge ? (
              <h3 className="text-white text-xl font-bold">{movie.title}</h3>
            ) : (
              <h4 className="text-white text-sm font-semibold">{movie.title}</h4>
            )}
            {(isLarge || isMedium) && (
              <span className="text-white/70 text-sm mt-1 line-clamp-2">
                {movie.description.replace(/<[^>]*>?/gm, '')}
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

export default function MovieGrid({ movies }: MovieGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 md:auto-rows-[152px] gap-4">
      {movies.map((movie, index) => {
        const patternIndex = index % 5;
        return (
          <MovieCard
            key={movie.id}
            movie={movie as Movie}
            patternIndex={patternIndex}
          />
        );
      })}
    </div>
  );
}

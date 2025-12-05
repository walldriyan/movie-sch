
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

  const movieImageUrl =
    movie.posterUrl ||
    PlaceHolderImages.find(
      (p) => p.id === 'movie-poster-placeholder'
    )?.imageUrl;

  const series = movie.series as Series | null;

  return (
    <div
      key={movie.id}
      className="relative overflow-hidden rounded-sm cursor-pointer group"
      style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}
    >
      <Link
        href={`/movies/${movie.id}`}
        className="block h-full w-full"
        aria-label={movie.title}
      >
        {/* Image - Full card */}
        <div className="relative w-full overflow-hidden">
          {!imageLoaded && <Skeleton className="w-full h-48" />}
          {movieImageUrl && (
            <Image
              src={movieImageUrl}
              alt={movie.title}
              width={500}
              height={400}
              className={cn(
                'w-full h-auto object-cover transition-all duration-300 group-hover:scale-105',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              priority={index < 4}
              quality={75}
            />
          )}

          {/* Hover Overlay with Play Button */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 bg-black/40">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
              </div>
              <span className="text-white text-xs font-medium px-3 py-1 rounded-full bg-black/50">
                Watch Now
              </span>
            </div>
          </div>

          {/* Lock badge - top right */}
          {movie.isLockedByDefault && (
            <div className="absolute top-2 right-2 z-30">
              <div className="flex items-center justify-center w-6 h-6 bg-black/60 rounded-sm">
                <Lock className="h-3 w-3 text-yellow-300" />
              </div>
            </div>
          )}

          {/* Type badge - top left */}
          {mounted && (
            <div className="absolute top-2 left-2 z-30">
              <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-sm text-xs font-medium text-white/90">
                {movie.type === 'MOVIE' ? <Clapperboard className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
              </div>
            </div>
          )}

          {/* Title & Info - Bottom absolute overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 z-10 bg-gradient-to-t from-black/80 to-transparent">
            <h3 className="font-semibold text-sm line-clamp-1 text-white">
              {movie.title}
            </h3>
            {series && series._count && series._count.posts > 0 && (
              <div className="flex items-center gap-1 text-xs text-white/70 mt-1">
                <List className="h-3 w-3" />
                <span>{series._count.posts} Episodes</span>
              </div>
            )}
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
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
      {posts.map((movie, index) => {
        return (
          <div key={movie.id} className="break-inside-avoid mb-3">
            <MovieCard
              movie={movie as Movie}
              index={index}
            />
          </div>
        );
      })}
    </div>
  );
}

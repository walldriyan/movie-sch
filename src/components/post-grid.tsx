
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Play, Clapperboard, Tv, Folder, List, Lock, Star } from 'lucide-react';
import type { Post as Movie, Series } from '@/lib/types';

interface MovieGridProps {
  posts: Movie[];
}

// Different aspect ratios for masonry effect - random but controlled
const ASPECT_RATIOS = [
  'aspect-[3/4]',   // Tall portrait
  'aspect-[4/5]',   // Portrait
  'aspect-[1/1]',   // Square
  'aspect-[4/3]',   // Landscape-ish
  'aspect-[2/3]',   // Extra tall
  'aspect-[5/6]',   // Medium portrait
];

// Get a deterministic "random" aspect ratio based on movie id
function getAspectRatio(id: number): string {
  const index = id % ASPECT_RATIOS.length;
  return ASPECT_RATIOS[index];
}

function MovieCard({ movie, index }: { movie: Movie; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if image exists and is valid
  const hasValidImage = movie.posterUrl && movie.posterUrl.trim() !== '' && !imgError;

  // Get deterministic aspect ratio based on movie ID for consistent masonry
  const aspectRatio = useMemo(() => getAspectRatio(movie.id), [movie.id]);

  const series = movie.series as Series | null;

  return (
    <div
      key={movie.id}
      className="relative overflow-hidden cursor-pointer group border border-white/[0.06] bg-[#1a1a1a] hover:border-white/[0.12] transition-all duration-300"
      style={{
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        borderRadius: '3px'
      }}
    >
      <Link
        href={`/movies/${movie.id}`}
        className="block h-full w-full"
        aria-label={movie.title}
      >
        {/* Image Container with dynamic aspect ratio */}
        <div className={cn("relative w-full overflow-hidden", aspectRatio)}>
          {hasValidImage ? (
            <Image
              src={movie.posterUrl!}
              alt={movie.title}
              fill
              className={cn(
                'object-cover transition-all duration-500 group-hover:scale-105',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImgError(true)}
              priority={index < 4}
              quality={75}
            />
          ) : (
            /* Very subtle dark gradient for missing images - barely visible */
            <div className="absolute inset-0 bg-gradient-to-br from-[#1f1f1f] via-[#181818] to-[#141414]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              {/* Centered icon - very subtle */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Clapperboard className="w-10 h-10 text-white/[0.06]" />
              </div>
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 bg-gradient-to-t from-black/70 via-black/40 to-black/20">
            <div className="flex flex-col items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-xl shadow-black/30">
                <Play className="w-6 h-6 text-black ml-0.5" fill="currentColor" />
              </div>
              <span className="text-white text-xs font-medium px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
                View Details
              </span>
            </div>
          </div>

          {/* Lock badge - top right */}
          {movie.isLockedByDefault && (
            <div className="absolute top-3 right-3 z-30">
              <div className="flex items-center justify-center w-7 h-7 bg-amber-500/20 backdrop-blur-md rounded-full border border-amber-500/30">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
              </div>
            </div>
          )}

          {/* Type badge - top left */}
          {mounted && (
            <div className="absolute top-3 left-3 z-30">
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white/90 rounded-full border border-white/10">
                {movie.type === 'MOVIE' ? <Clapperboard className="w-3 h-3" /> : movie.type === 'TV_SERIES' ? <Tv className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
                <span className="hidden sm:inline">{movie.type === 'MOVIE' ? 'Movie' : movie.type === 'TV_SERIES' ? 'Series' : 'Other'}</span>
              </div>
            </div>
          )}

          {/* Rating badge */}
          {movie.imdbRating && movie.imdbRating > 0 && (
            <div className="absolute top-3 right-3 z-30">
              <div className="flex items-center gap-1 bg-yellow-500/20 backdrop-blur-md px-2 py-1 rounded-full border border-yellow-500/30">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold text-yellow-400">{movie.imdbRating.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Bottom gradient and info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <h3 className="font-bold text-base line-clamp-2 text-white mb-1 group-hover:text-purple-300 transition-colors">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/60">
              {movie.year && <span>{movie.year}</span>}
              {movie.duration && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span>{movie.duration}</span>
                </>
              )}
            </div>
            {series && series._count && series._count.posts > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-purple-400 mt-2">
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
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
      {posts.map((movie, index) => (
        <div key={movie.id} className="break-inside-avoid mb-4">
          <MovieCard
            movie={movie as Movie}
            index={index}
          />
        </div>
      ))}
    </div>
  );
}

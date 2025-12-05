
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
      className="relative block overflow-hidden rounded-xl bg-card/50 backdrop-blur-sm border border-white/5 cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:border-white/20"
    >
      <Link
        href={`/movies/${movie.id}`}
        className="block h-full w-full"
        aria-label={movie.title}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl">
          {!imageLoaded && <Skeleton className="absolute inset-0" />}
          {movieImageUrl && (
            <Image
              src={movieImageUrl}
              alt={movie.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={cn(
                'object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-75',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              priority={index < 4}
              quality={75}
            />
          )}

          {/* Overlay gradient - stronger for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Play Button Overlay - Suno.com style */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
              <Play className="w-7 h-7 text-black ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Lock badge - top right */}
          {movie.isLockedByDefault && (
            <div className="absolute top-3 right-3 z-30">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full text-xs font-medium border border-white/10">
                <Lock className="h-3.5 w-3.5 text-yellow-400" />
              </div>
            </div>
          )}

          {/* Type badge - top left */}
          {mounted && (
            <div className="absolute top-3 left-3 z-30">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full text-xs font-medium text-white/90 border border-white/10">
                {movie.type === 'MOVIE' ? <Clapperboard className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{movie.type === 'MOVIE' ? 'Movie' : 'Series'}</span>
              </div>
            </div>
          )}

          {/* Series count - bottom left */}
          {mounted && series && series._count && series._count.posts > 0 && (
            <div className="absolute bottom-3 left-3 z-30">
              <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full text-xs font-medium text-white/90 border border-white/10">
                <List className="h-3.5 w-3.5" />
                <span>{series._count.posts} Episodes</span>
              </div>
            </div>
          )}
        </div>

        {/* Content - Suno.com style */}
        <div className="p-4 space-y-2.5 bg-gradient-to-b from-card/80 to-card">
          <h3 className="font-semibold text-base line-clamp-1 text-white group-hover:text-primary transition-colors">
            {movie.title}
          </h3>
          <div
            className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />

          {/* Author - improved spacing */}
          <div className="flex items-center gap-2.5 pt-2">
            <Avatar className="h-6 w-6 ring-2 ring-white/10">
              {authorAvatarUrl && <AvatarImage src={authorAvatarUrl} alt={movie.author.name || 'Author'} />}
              <AvatarFallback className="text-xs bg-primary/20 text-primary">{movie.author.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground/70 truncate font-medium">{movie.author.name}</span>
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

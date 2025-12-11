
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

import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { Crown } from 'lucide-react';

function MovieCard({ movie, index }: { movie: Movie; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = session?.user;
  const isPremiumGroup = (movie as any).group?.isPremiumOnly;

  // Check if user has access to premium content
  const hasPremiumAccess = user &&
    (user.role === 'SUPER_ADMIN' || user.role === 'USER_ADMIN' ||
      user.accountType === 'PREMIUM' || user.accountType === 'HYBRID');

  const isLocked = isPremiumGroup && !hasPremiumAccess;

  const handleCardClick = (e: React.MouseEvent) => {
    if (isLocked) {
      e.preventDefault();
      toast({
        title: "Premium Content",
        description: "This content is exclusive to Premium members. Please upgrade to access.",
        variant: "destructive"
      });
    }
  };

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
        href={isLocked ? '#' : `/movies/${movie.id}`}
        onClick={handleCardClick}
        className="block h-full w-full"
        aria-label={movie.title}
      >
        {/* Image Container with dynamic aspect ratio */}
        <div className={cn("relative w-full overflow-hidden", aspectRatio)}>
          {(hasValidImage) ? (
            <Image
              src={movie.posterUrl!}
              alt={movie.title}
              fill
              className={cn(
                'object-cover transition-all duration-500 group-hover:scale-105',
                imageLoaded ? 'opacity-100' : 'opacity-0',
                isLocked && 'blur-md brightness-50' // Blur effect for locked content
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImgError(true)}
              priority={index < 4}
              quality={75}
            />
          ) : (
            /* Gradient for missing images */
            <div className={cn(
              "absolute inset-0",
              movie.type === 'OTHER'
                ? "bg-gradient-to-br from-slate-900 to-blue-900" // Help Docs: Dark Navy Blue
                : "bg-gradient-to-br from-[#1f1f1f] via-[#181818] to-[#141414]"
            )}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                {movie.type === 'OTHER' ? (
                  <div className="w-full h-full flex items-center justify-center opacity-30">
                    <div className="w-24 h-24 bg-blue-500/20 blur-[40px] rounded-full" />
                  </div>
                ) : (
                  <Clapperboard className="w-10 h-10 text-white/[0.06]" />
                )}
              </div>
            </div>
          )}

          {/* Locked Overlay for Premium */}
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-40">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-2">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <span className="text-amber-400 font-bold text-sm tracking-wider uppercase drop-shadow-md">Premium Only</span>
            </div>
          )}

          {/* Hover Overlay - Only if NOT locked */}
          {!isLocked && (
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
          )}

          {/* Lock badge - top right (Existing standard lock) */}
          {movie.isLockedByDefault && !isLocked && (
            <div className="absolute top-3 right-3 z-30">
              <div className="flex items-center justify-center w-7 h-7 bg-amber-500/20 backdrop-blur-md rounded-full border border-amber-500/30">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
              </div>
            </div>
          )}

          {/* Premium Badge (Golden Crown) - if isPremiumGroup and User HAS access */}
          {isPremiumGroup && !isLocked && (
            <div className="absolute top-3 right-3 z-30">
              <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full shadow-lg shadow-amber-500/30">
                <Crown className="h-4 w-4 text-black" strokeWidth={2.5} />
              </div>
            </div>
          )}

          {/* PINNED (Simulated for First Help Item) - If Type OTHER and Index 0 (or manually set in future) */}
          {movie.type === 'OTHER' && index === 0 && (
            <div className="absolute top-3 right-3 z-30">
              <div className="flex items-center justify-center w-8 h-8 bg-black/60 backdrop-blur-md text-white rounded-full shadow-lg border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pin"><line x1="12" x2="12" y1="17" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></svg>
              </div>
            </div>
          )}


          {/* Type badge - top left */}
          {mounted && (
            <div className="absolute top-3 left-3 z-30">
              <div className={cn(
                "flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 text-xs font-medium text-white/90 rounded-full border border-white/10 bg-black/60"
              )}>
                {movie.type === 'MOVIE' ? <Clapperboard className="w-3 h-3" /> :
                  movie.type === 'TV_SERIES' ? <Tv className="w-3 h-3" /> :
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="M8 15h8" /></svg>}

                <span className="hidden sm:inline">
                  {movie.type === 'MOVIE' ? 'Movie' :
                    movie.type === 'TV_SERIES' ? 'Series' : 'Other'}
                </span>
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
              {/* Hide details if locked maybe? Or keep them as teaser */}
              {movie.year && movie.type !== 'OTHER' && <span>{movie.year}</span>}
              {movie.duration && movie.type !== 'OTHER' && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span>{movie.duration}</span>
                </>
              )}
              {movie.type === 'OTHER' && <span>Documentation</span>}
            </div>
            {series && series._count && series._count.posts > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-purple-400 mt-2">
                <List className="h-3 w-3" />
                <span>{series._count.posts} {movie.type === 'OTHER' ? 'Articles' : 'Episodes'}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

import { SponsoredPost } from '@prisma/client';
import { ExternalLink } from 'lucide-react';
import { PlaceAdCard } from './home/place-ad-card';

// Ad Card Component - Mimics MovieCard
function AdCard({ ad, index }: { ad: SponsoredPost; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Deterministic aspect ratio based on ID string length or similar hash
  const aspectRatio = useMemo(() => {
    const val = ad.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return getAspectRatio(val);
  }, [ad.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="relative overflow-hidden cursor-pointer group border border-purple-500/20 bg-[#1a1a1a] hover:border-purple-500/40 transition-all duration-300"
      style={{
        boxShadow: '0 2px 4px rgba(168, 85, 247, 0.1)',
        borderRadius: '3px'
      }}
    >
      <Link
        href={ad.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full w-full"
        aria-label={ad.title}
      >
        {/* Image Container with dynamic aspect ratio */}
        <div className={cn("relative w-full overflow-hidden", aspectRatio)}>
          <Image
            src={ad.imageUrl}
            alt={ad.title}
            fill
            className={cn(
              'object-cover transition-all duration-500 group-hover:scale-105',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setImageLoaded(true)}
            quality={75}
          />

          {/* Sponsored Badge */}
          <div className="absolute top-3 left-3 z-30">
            <div className={cn(
              "flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white/90 rounded-full border border-purple-500/30 bg-purple-900/80"
            )}>
              <Star className="w-3 h-3 text-purple-300 fill-purple-300" />
              <span className="uppercase tracking-wider text-[10px]">Sponsored</span>
            </div>
          </div>

          {/* Link Icon Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 bg-gradient-to-t from-purple-900/80 via-purple-900/40 to-transparent">
            <div className="flex flex-col items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-xl shadow-purple-900/30">
                <ExternalLink className="w-6 h-6 text-purple-700 ml-0.5" />
              </div>
              <span className="text-white text-xs font-medium px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                Visit Site
              </span>
            </div>
          </div>

          {/* Bottom gradient and info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <h3 className="font-bold text-base line-clamp-2 text-white mb-1 group-hover:text-purple-300 transition-colors">
              {ad.title}
            </h3>
            {ad.description && (
              <p className="text-xs text-white/70 line-clamp-1">
                {ad.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function PostGrid({ posts }: { posts: (Movie | any)[] }) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
      {posts.map((item, index) => (
        <div key={item.id ? (item.id + '-' + index) : `placeholder-${index}`} className="break-inside-avoid mb-4">
          {/* Check if it's the Place Ad Placeholder */}
          {item.isPlaceAdPlaceholder ? (
            <PlaceAdCard />
          ) : ('link' in item && 'priority' in item) ? (
            /* Check if it's an Ad */
            <AdCard ad={item as SponsoredPost} index={index} />
          ) : (
            /* Normal Movie Card */
            <MovieCard
              movie={item as Movie}
              index={index}
            />
          )}
        </div>
      ))}
    </div>
  );
}

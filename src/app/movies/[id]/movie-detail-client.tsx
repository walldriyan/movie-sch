
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Share2,
  ListVideo,
  Tag,
} from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Movie } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function MovieDetailClient({
  movie,
  children,
}: {
  movie: Movie;
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = React.useState('about');
  const heroImage =
    movie.posterUrl
      ? movie.posterUrl
      : PlaceHolderImages.find((img) => img.id === 'movie-poster-placeholder')
          ?.imageUrl;

  const authorAvatarUrl = movie.author.image || PlaceHolderImages.find((img) => img.id === 'avatar-1')?.imageUrl;

  const tabButtonStyle =
    'flex items-center gap-2 cursor-pointer transition-colors hover:text-foreground pb-3 border-b-2';
  const activeTabButtonStyle = 'text-primary font-semibold border-primary';
  const inactiveTabButtonStyle = 'border-transparent';

  return (
    <>
      <header className="relative h-[500px] rounded-2xl overflow-hidden flex items-end justify-between">
        {heroImage && (
          <Image
            src={heroImage}
            alt={`Poster for ${movie.title}`}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />

        <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-2 justify-end">
            {movie.genres.map((genre: string) => (
            <Button key={genre} variant="outline" size="sm" className="rounded-full bg-black/20 backdrop-blur-sm border-white/20 hover:bg-white/20">
                <Tag className="mr-2 h-4 w-4" />
                {genre}
            </Button>
            ))}
        </div>

        <div className="relative z-10 text-foreground flex flex-col items-start text-left px-4 md:px-8 pb-0 max-w-4xl w-full">
          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-4">
            {movie.title}
          </h1>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-8">
            <Link
              href={`/profile/${movie.author.id}`}
              className="flex items-center gap-4 group"
            >
              <Avatar>
                {authorAvatarUrl && (
                  <AvatarImage
                    src={authorAvatarUrl}
                    alt={movie.author.name || 'Author'}
                    data-ai-hint="person face"
                  />
                )}
                <AvatarFallback>{movie.author.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-foreground group-hover:text-primary">
                  {movie.author.name}
                </p>
                <div className="flex items-center gap-2">
                  <span>{movie.year}</span>
                  <span>&middot;</span>
                  <span>{movie.duration}</span>
                </div>
              </div>
            </Link>
          </div>

          <Separator className="my-4 bg-border/20" />
          <div className="flex items-center justify-between py-2 text-muted-foreground w-full">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('about')}
                className={cn(
                  tabButtonStyle,
                  activeTab === 'about'
                    ? activeTabButtonStyle
                    : inactiveTabButtonStyle
                )}
              >
                <Image src="/imdb.png" alt="IMDb" width={40} height={20} />
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-foreground">
                    {movie.imdbRating.toFixed(1)}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={cn(
                  tabButtonStyle,
                  activeTab === 'reviews'
                    ? activeTabButtonStyle
                    : inactiveTabButtonStyle
                )}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-foreground">{movie.reviews.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('subtitles')}
                className={cn(
                  tabButtonStyle,
                  activeTab === 'subtitles'
                    ? activeTabButtonStyle
                    : inactiveTabButtonStyle
                )}
              >
                <ListVideo className="w-5 h-5" />
                <span className="text-foreground">Subtitles</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bookmark className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} className="mt-8 px-4 md:px-8 max-w-4xl">
        {children}
      </Tabs>
    </>
  );
}

'use client';

import React, { useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Share2,
  ListVideo,
  Tag,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
} from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Movie, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toggleLikeMovie, toggleFavoriteMovie } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export default function MovieDetailClient({
  movie,
  currentUser,
  children,
}: {
  movie: Movie;
  currentUser?: User;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFavoritePending, startFavoriteTransition] = useTransition();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('about');
  const heroImage =
    movie.posterUrl
      ? movie.posterUrl
      : PlaceHolderImages.find((img) => img.id === 'movie-poster-placeholder')
          ?.imageUrl;

  const authorAvatarUrl = movie.author.image || PlaceHolderImages.find((img) => img.id === 'avatar-1')?.imageUrl;

  const tabButtonStyle =
    'flex items-center gap-2 cursor-pointer transition-colors hover:text-foreground pb-3 border-b-2 whitespace-nowrap';
  const activeTabButtonStyle = 'text-primary font-semibold border-primary';
  const inactiveTabButtonStyle = 'border-transparent';
  
  const handleLike = (like: boolean) => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to like or dislike a movie.',
      });
      return;
    }
    startTransition(() => {
      toggleLikeMovie(movie.id, like)
        .then(() => {
          toast({
            title: 'Success',
            description: `Your preference has been updated.`,
          });
        })
        .catch((err) => {
          toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: err.message,
          });
        });
    });
  };

  const handleFavorite = () => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to add a movie to favorites.',
      });
      return;
    }
    startFavoriteTransition(() => {
      toggleFavoriteMovie(movie.id)
        .then(() => {
          toast({
            title: 'Favorites Updated',
            description: `Movie has been ${isFavorited ? 'removed from' : 'added to'} your favorites.`,
          });
        })
        .catch((err) => {
          toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: err.message,
          });
        });
    });
  };
  
  const isFavorited = currentUser && movie.favoritedBy && movie.favoritedBy.some(fav => fav.userId === currentUser?.id);


  return (
    <>
      <header className="relative h-[500px] w-full rounded-b-2xl overflow-hidden flex items-end">
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

        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 rounded-full bg-black/20 backdrop-blur-sm border-white/20 hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>

        <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-2 justify-end">
            {movie.genres.map((genre: string) => (
            <Button key={genre} variant="outline" size="sm" className="rounded-full bg-black/20 backdrop-blur-sm border-white/20 hover:bg-white/20">
                <Tag className="mr-2 h-4 w-4" />
                {genre}
            </Button>
            ))}
        </div>

        <div className="relative z-10 text-foreground flex flex-col items-start text-left pb-0 w-full pr-8">
          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-4 text-left">
            {movie.title}
          </h1>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2.5">
            <Link
              href={`/profile/${movie.author.id}`}
              className="flex items-center gap-4 group"
            >
              <Avatar className='w-16 h-16'>
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
          <div className="flex items-center justify-between py-2 text-muted-foreground w-full overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-6 flex-shrink-0">
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
            <div className="flex items-center gap-2 pl-4">
              <Button variant="ghost" size="icon" onClick={handleFavorite} disabled={isFavoritePending}>
                 <Bookmark className={cn("w-5 h-5", isFavorited && "text-primary fill-primary")} />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-2" />
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

      <Tabs value={activeTab} className="mt-8">
        {children}
      </Tabs>
    </>
  );
}

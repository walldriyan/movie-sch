'use server';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Film, Star, CalendarDays, Clock } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFavoriteMovies } from '@/lib/actions';
import type { Movie } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, formatRelative } from 'date-fns';

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const favoriteMovies = await getFavoriteMovies();
  const movies = favoriteMovies as any[];

  const authorAvatarPlaceholder = PlaceHolderImages.find((img) => img.id === 'avatar-1');
  
  if (movies.length === 0) {
    return (
      <div className="w-full bg-background text-foreground">
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 text-center mt-16">
          <div className="max-w-md">
             <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-serif text-4xl font-bold">
              No Favorites Yet
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              You haven't added any movies to your favorites. Click the bookmark icon on a movie to save it here.
            </p>
             <Button asChild className="mt-8">
                <Link href="/">Browse Movies</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full bg-background text-foreground">
      <TooltipProvider>
        <main className="max-w-4xl mx-auto px-4 py-8">
           <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold">My Favorites</h1>
            <p className="text-muted-foreground mt-2">A collection of movies you've saved.</p>
           </div>

          <Separator className="mb-8" />
          
          <div className={`space-y-12 transition-opacity`}>
            {movies.map((movie) => {
              const movieImageUrl =
                movie.posterUrl ||
                PlaceHolderImages.find(
                  (p) => p.id === 'movie-poster-placeholder'
                )?.imageUrl;
              
              const authorAvatarUrl = movie.author?.image || authorAvatarPlaceholder?.imageUrl;
              const postDate = new Date(movie.updatedAt);
              const now = new Date();
              const relativeDate = formatRelative(postDate, now);

              return (
                <article key={movie.id}>
                  <div className="flex items-center space-x-3 mb-4 text-sm">
                    <Link
                      href={`/profile/${movie.author.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar className="w-6 h-6">
                        {authorAvatarUrl && (
                          <AvatarImage
                            src={authorAvatarUrl}
                            alt={movie.author.name || 'Author'}
                            data-ai-hint="person face"
                          />
                        )}
                        <AvatarFallback>{movie.author.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground group-hover:text-primary">
                        {movie.author.name}
                      </span>
                    </Link>

                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-muted-foreground cursor-default">
                          {relativeDate.charAt(0).toUpperCase() + relativeDate.slice(1)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{format(postDate, "MMMM d, yyyy 'at' h:mm a")}</p>
                      </TooltipContent>
                    </Tooltip>

                  </div>

                  <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8">
                      <Link href={`/movies/${movie.id}`} className="group block">
                        <h2 className="font-serif text-2xl font-bold leading-snug group-hover:text-primary transition-colors">
                            {movie.title}
                        </h2>
                      </Link>
                      <div
                        className="prose prose-sm prose-invert text-muted-foreground mt-2 line-clamp-2 [&_img]:hidden"
                        dangerouslySetInnerHTML={{ __html: movie.description }}
                      />
                    </div>
                    <div className="col-span-4">
                      {movieImageUrl && (
                        <Link
                          href={`/movies/${movie.id}`}
                          className="block aspect-video relative overflow-hidden rounded-md"
                        >
                          <Image
                            src={movieImageUrl}
                            alt={movie.title}
                            fill
                            className="object-cover"
                          />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{movie.imdbRating.toFixed(1)}</span>
                    </div>
                    <span>&middot;</span>
                    <span>{movie.duration}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      </TooltipProvider>
    </div>
  );
}

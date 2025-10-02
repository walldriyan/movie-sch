'use client';

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Film, Globe, Star, Tv, TrendingUp, Calendar, SlidersHorizontal, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMovies } from '@/lib/actions';
import type { Movie } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import AdvancedFilterDialog from '@/components/advanced-filter-dialog';
import type { FilterState } from '@/components/advanced-filter-dialog';
import { format, formatRelative, subDays } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Loading from './loading';

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'updatedAt-desc',
    genres: [],
    yearRange: [1980, new Date().getFullYear()],
    ratingRange: [0, 10],
  });

  useEffect(() => {
    startTransition(async () => {
      const { movies: fetchedMovies } = await getMovies({ filters });
      setMovies(fetchedMovies as any);
    });
  }, [filters]);
  
  const authorAvatarPlaceholder = PlaceHolderImages.find((img) => img.id === 'avatar-1');

  if (isPending) {
    return <Loading />;
  }
  
  if (movies.length === 0 && !isPending) {
    return (
      <div className="w-full bg-background text-foreground">
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 text-center mt-16">
          <div className="max-w-md">
            <h1 className="font-serif text-4xl font-bold">
              No Movies Found
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              No movies match your current filter criteria. Try adjusting your filters.
            </p>
             <AdvancedFilterDialog 
                allGenres={['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Animation']}
                currentFilters={filters}
                onApplyFilters={setFilters}
                triggerButton={
                  <Button className="mt-6" size="lg">
                    <SlidersHorizontal className="mr-2 h-5 w-5" />
                    Adjust Filters
                  </Button>
                }
              />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full bg-background text-foreground">
      <TooltipProvider>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
              <Button variant="secondary" className="rounded-full">
                  <Film />
                  <span>All</span>
              </Button>
              <Button variant="outline" className="rounded-full">
                  <Globe />
                  <span>International</span>
              </Button>
              <Button variant="outline" className="rounded-full">
                  <Tv />
                  <span>Series</span>
              </Button>
          </div>

          <Separator className="mb-8" />
          
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="rounded-full">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Trending
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full">
                      <Star className="mr-2 h-4 w-4" />
                      Top Rated
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full">
                      <Calendar className="mr-2 h-4 w-4" />
                      New Releases
                  </Button>
              </div>
              <AdvancedFilterDialog 
                  allGenres={['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Animation']}
                  currentFilters={filters}
                  onApplyFilters={setFilters}
                  triggerButton={
                      <Button variant="link" size="sm" className="rounded-full text-muted-foreground">
                          <SlidersHorizontal className="mr-2 h-4 w-4" />
                          <span>Advanced Filters</span>
                      </Button>
                  }
              />
          </div>
          
          <div className={`space-y-12 transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
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

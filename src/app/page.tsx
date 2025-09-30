'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import MovieCard from '@/components/movie-card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Star, Clapperboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Movie } from '@/lib/types';
import Loading from './loading';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const LOCAL_STORAGE_KEY = 'movies_data';

export default function HomePage() {
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedMovies = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedMovies) {
        setAllMovies(JSON.parse(storedMovies));
      } else {
        // If no movies in storage, start with an empty array
        setAllMovies([]);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      }
    } catch (error) {
      console.error("Could not parse movies from localStorage", error);
      // Fallback to an empty array in case of error
      setAllMovies([]);
    }
  }, []);

  if (!isMounted) {
    return <Loading />;
  }

  const featuredMovie = allMovies.length > 0 ? allMovies[0] : null;
  const trendingMovies = allMovies.slice(1, 7);
  const popularMovies = allMovies.slice(7, 13);
  
  const featuredMovieHero = featuredMovie ? PlaceHolderImages.find(
    (p) => p.id === featuredMovie.galleryImageIds[0]
  ) : null;

  if (allMovies.length === 0 || !featuredMovie) {
    return (
      <div className="w-full bg-background text-foreground">
        <Header />
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 text-center">
          <div>
            <h1 className="font-headline text-3xl font-bold">No movies found.</h1>
            <p className="mt-2 text-muted-foreground">Please add some movies from the 'Manage Movies' page.</p>
             <Button asChild className="mt-4">
              <Link href="/manage">Go to Manage Movies</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="w-full bg-background text-foreground">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] w-full md:h-[80vh]">
          {featuredMovieHero && (
            <Image
              src={featuredMovieHero.imageUrl}
              alt={`Backdrop for ${featuredMovie.title}`}
              fill
              className="object-cover object-top"
              priority
              data-ai-hint={featuredMovieHero.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
          <div className="container relative z-10 flex h-full items-end pb-12 md:pb-20">
            <div className="w-full max-w-lg space-y-4">
              <h1 className="font-headline text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
                {featuredMovie.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span>{featuredMovie.imdbRating.toFixed(1)}</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span>{featuredMovie.year}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{featuredMovie.duration}</span>
              </div>
              <p className="text-foreground/80 line-clamp-3 leading-relaxed">
                {Array.isArray(featuredMovie.description) ? featuredMovie.description[0] : featuredMovie.description}
              </p>
              <div className="pt-4">
                 <Button size="lg" asChild>
                  <Link href={`/movies/${featuredMovie.id}`}>
                    <Clapperboard className="mr-2 h-5 w-5" />
                    Watch Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Movie Lists Section */}
        <section className="container space-y-12 py-12 md:py-16">
          {/* Now Trending Section */}
          {trendingMovies.length > 0 && (
            <div>
              <h2 className="mb-6 font-headline text-2xl font-bold md:text-3xl">
                Now Trending
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {trendingMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    posterUrlId={movie.posterUrlId}
                    description={Array.isArray(movie.description) ? movie.description.join(' ') : movie.description}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Popular Section */}
          {popularMovies.length > 0 && (
            <div>
              <h2 className="mb-6 font-headline text-2xl font-bold md:text-3xl">
                Popular Movies
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {popularMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    posterUrlId={movie.posterUrlId}
                    description={Array.isArray(movie.description) ? movie.description.join(' ') : movie.description}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

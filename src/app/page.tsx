
'use client';

import { useState } from 'react';
import { getMovieById, getAllMovies } from '@/lib/data';
import type { Movie } from '@/lib/types';
import Header from '@/components/header';
import MovieCard from '@/components/movie-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const allMovies = getAllMovies();
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>(allMovies);
  const [activeGenre, setActiveGenre] = useState<string>('All');

  const genres = ['All', ...new Set(allMovies.flatMap((movie) => movie.genres))];

  const handleGenreChange = (genre: string) => {
    setActiveGenre(genre);
    if (genre === 'All') {
      setFilteredMovies(allMovies);
    } else {
      setFilteredMovies(allMovies.filter((movie) => movie.genres.includes(genre)));
    }
  };

  const featuredMovie = getMovieById(2) ?? allMovies[0];
  const featuredMovieImage = PlaceHolderImages.find(p => p.id === featuredMovie.posterUrlId);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[60vh] min-h-[500px]">
          <div className="absolute inset-0">
            {featuredMovieImage && (
              <Image
                src={featuredMovieImage.imageUrl}
                alt={`Poster for ${featuredMovie.title}`}
                fill
                className="object-cover"
                data-ai-hint={featuredMovieImage.imageHint}
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
          </div>
          <div className="container relative z-10 flex h-full flex-col justify-end pb-16">
            <h1 className="font-headline text-4xl font-bold text-foreground md:text-5xl lg:text-6xl max-w-2xl">
              {featuredMovie.title}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-foreground/80">
              {featuredMovie.description[0]}
            </p>
            <div className="mt-6 flex items-center space-x-4">
              <Link href={`/movies/${featuredMovie.id}`} passHref>
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <PlayCircle className="mr-2" />
                  Watch Now
                </Button>
              </Link>
              <Link href={`/movies/${featuredMovie.id}`} passHref>
                <Button size="lg" variant="outline">
                  More Info
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Movies Grid Section */}
        <section className="container py-12">
          <Tabs value={activeGenre} onValueChange={handleGenreChange} className="mb-8">
            <TabsList>
              {genres.map((genre) => (
                <TabsTrigger key={genre} value={genre}>
                  {genre}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                description={movie.description[0]}
                posterUrlId={movie.posterUrlId}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

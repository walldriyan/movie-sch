
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import MovieCard from '@/components/movie-card';
import { getAllMovies } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { Star, Clapperboard } from 'lucide-react';

export default function HomePage() {
  const allMovies = getAllMovies();
  const featuredMovie = allMovies.find(m => m.id === 1); // Inception
  const trendingMovies = allMovies.filter(m => m.id !== 1).slice(0, 4);
  const popularMovies = allMovies.filter(m => ![1, 2, 3, 4].includes(m.id));

  const featuredMoviePoster = PlaceHolderImages.find(
    (p) => p.id === featuredMovie?.posterUrlId
  );
  const featuredMovieHero = PlaceHolderImages.find(
    (p) => p.id === featuredMovie?.galleryImageIds[0]
  );

  if (!featuredMovie) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p>No movies found.</p>
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
                {featuredMovie.description[0]}
              </p>
              <div className="pt-4">
                <Button size="lg">
                  <Clapperboard className="mr-2 h-5 w-5" />
                  Watch Now
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Movie Lists Section */}
        <section className="container space-y-12 py-12 md:py-16">
          {/* Now Trending Section */}
          <div>
            <h2 className="mb-6 font-headline text-2xl font-bold md:text-3xl">
              Now Trending
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {allMovies.slice(1, 7).map((movie) => (
                <MovieCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  posterUrlId={movie.posterUrlId}
                  description={movie.description.join(' ')}
                />
              ))}
            </div>
          </div>

          {/* Popular Section */}
          <div>
            <h2 className="mb-6 font-headline text-2xl font-bold md:text-3xl">
              Popular Movies
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {allMovies.slice(0, 6).map((movie) => (
                <MovieCard
                  key={movie.id}
                  id={movie.id}
                  title={movie.title}
                  posterUrlId={movie.posterUrlId}
                  description={movie.description.join(' ')}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const Separator = ({
  orientation,
  className,
}: {
  orientation: 'vertical' | 'horizontal';
  className?: string;
}) => (
  <div
    className={`bg-border ${
      orientation === 'vertical' ? 'w-px h-full' : 'h-px w-full'
    } ${className}`}
  />
);

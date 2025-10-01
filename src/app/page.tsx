import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Film, Globe, Star, Tv } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMovies } from '@/lib/actions';
import type { Movie } from '@prisma/client';
import { auth } from '@/auth';
import { Separator } from '@/components/ui/separator';

export default async function HomePage() {
  const session = await auth();
  const allMovies = (await getMovies()) as Movie[];

  if (allMovies.length === 0) {
    return (
      <div className="w-full bg-background text-foreground">
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 text-center mt-16">
          <div className="max-w-md">
            <h1 className="font-serif text-4xl font-bold">
              Your Catalog is Empty
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start by adding your favorite movies to build your personal
              CineVerse.
            </p>
            {session?.user?.role === 'SUPER_ADMIN' && (
              <Button asChild className="mt-6" size="lg">
                <Link href="/manage">Add Your First Movie</Link>
              </Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  const authorAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-1');

  return (
    <div className="w-full bg-background text-foreground">
      <main className="max-w-4xl mx-auto px-4 py-8 mt-16">
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

        <Separator className="mb-12" />
        
        <div className="space-y-12">
          {allMovies.map((movie) => {
            const movieImageUrl =
              movie.posterUrl ||
              PlaceHolderImages.find(
                (p) => p.id === 'movie-poster-placeholder'
              )?.imageUrl;

            return (
              <article key={movie.id}>
                <div className="flex items-center space-x-3 mb-4 text-sm">
                  <Link
                    href="/profile/cineverse-editor"
                    className="flex items-center gap-3 group"
                  >
                    <Avatar className="w-6 h-6">
                      {authorAvatar && (
                        <AvatarImage
                          src={authorAvatar.imageUrl}
                          alt="Author"
                          data-ai-hint={authorAvatar.imageHint}
                        />
                      )}
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground group-hover:text-primary">
                      CineVerse Editor
                    </span>
                  </Link>
                  <span className="text-muted-foreground">{movie.year}</span>
                </div>

                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-8">
                    <Link href={`/movies/${movie.id}`}>
                      <div className="group">
                        <h2 className="font-serif text-2xl font-bold leading-snug group-hover:text-primary transition-colors">
                          {movie.title}
                        </h2>
                        <div
                          className="prose prose-sm prose-invert text-muted-foreground mt-2 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: movie.description }}
                        />
                      </div>
                    </Link>
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
    </div>
  );
}

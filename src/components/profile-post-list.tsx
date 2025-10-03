
import Image from 'next/image';
import Link from 'next/link';
import { Star, VideoOff, Pencil } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Movie, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProfilePostListProps {
  movies: Movie[];
  isOwnProfile: boolean;
  currentFilter: string;
  profileUser: User;
}

export default function ProfilePostList({ movies, isOwnProfile, currentFilter, profileUser }: ProfilePostListProps) {
  if (movies.length === 0) {
    return (
      <Card className="text-center border-dashed">
        <CardContent className="p-16 flex flex-col items-center gap-4">
          <VideoOff className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {currentFilter === 'posts' ? 'No Movies Yet' : 'No Favorites Yet'}
          </h3>
          <p className="text-muted-foreground">
            {currentFilter === 'posts'
              ? `${profileUser.name} hasn't posted any movies yet.`
              : `No favorite movies to display.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      {movies.map((movie: any) => {
        const movieImageUrl =
          movie.posterUrl ||
          PlaceHolderImages.find(
            (p) => p.id === 'movie-poster-placeholder'
          )?.imageUrl;

        return (
          <article key={movie.id}>
            <div className="flex items-center space-x-3 mb-4 text-sm">
              <span className="text-muted-foreground">{movie.year}</span>
            </div>

            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-8">
                <Link href={`/movies/${movie.id}`} className="group block mb-2">
                  <h2 className="font-serif text-2xl font-bold leading-snug group-hover:text-primary transition-colors">
                    {movie.title}
                  </h2>
                </Link>
                <div
                  className="prose prose-sm prose-invert text-muted-foreground mt-2 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: movie.description }}
                />
              </div>
              <div className="col-span-4 relative group">
                {movieImageUrl && (
                  <Link
                    href={`/movies/${movie.id}`}
                    className="block aspect-video relative overflow-hidden rounded-md"
                  >
                    <Image
                      src={movieImageUrl}
                      alt={movie.title}
                      fill
                      className="object-cover rounded-2xl"
                    />
                  </Link>
                )}
                {isOwnProfile && currentFilter === 'posts' && (
                  <Button asChild size="sm" className="absolute top-2 right-2">
                    <Link href={`/manage?edit=${movie.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
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
  );
}

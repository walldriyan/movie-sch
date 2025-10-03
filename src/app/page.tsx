
'use server';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Film, Globe, Star, Tv, SlidersHorizontal, Users, Play } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMovies, getUsers } from '@/lib/actions';
import type { Movie, User } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';


export default async function HomePage({ searchParams }: { searchParams?: { timeFilter?: string } }) {
  const timeFilter = searchParams?.timeFilter;

  const { movies: fetchedMovies } = await getMovies({ filters: { timeFilter } });
  const movies = fetchedMovies as any[];
  const users = (await getUsers()) as User[];
  
  const userAvatarPlaceholder = PlaceHolderImages.find(
    (img) => img.id === 'avatar-4'
  );
  
  if (movies.length === 0) {
    return (
      <div className="w-full bg-background text-foreground">
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 text-center mt-16">
          <div className="max-w-md">
            <h1 className="font-serif text-4xl font-bold">
              No Movies Found
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              No movies match the current filters. Try a different filter.
            </p>
             <Button asChild className="mt-8">
                <Link href="/">Clear Filters</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full bg-background text-foreground">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar">
              <Button variant={'secondary'} className="rounded-full">
                  <Film />
                  <span>All</span>
              </Button>
              <Button variant="outline" className="rounded-full bg-transparent border-gray-700 hover:bg-gray-800">
                  <Globe />
                  <span>International</span>
              </Button>
              <Button variant="outline" className="rounded-full bg-transparent border-gray-700 hover:bg-gray-800">
                  <Tv />
                  <span>Series</span>
              </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 md:auto-rows-[152px] gap-4">
              {movies.map((movie, index) => {
                const movieImageUrl =
                  movie.posterUrl ||
                  PlaceHolderImages.find(
                    (p) => p.id === 'movie-poster-placeholder'
                  )?.imageUrl;
                
                const patternIndex = index % 5;
                const isLarge = patternIndex === 0;
                const isMedium = patternIndex === 1;

                return (
                  <Link
                    href={`/movies/${movie.id}`}
                    key={movie.id}
                    className={cn(
                      'relative block overflow-hidden rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] cursor-pointer bg-[#0b0d0f]',
                      isLarge && 'md:col-span-2 md:row-span-2',
                      isMedium && 'md:row-span-2',
                    )}
                  >
                    {movieImageUrl && (
                      <Image
                        src={movieImageUrl}
                        alt={movie.title}
                        fill
                        className="object-cover rounded-xl"
                      />
                    )}
                    {/* Gradient + Blur Overlay */}
                    <div className="absolute inset-x-0 top-1/2 bottom-0 bg-gradient-to-t from-black/90 to-transparent backdrop-blur-sm rounded-xl"></div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-end justify-between">
                        <div>
                          {isLarge ? (
                            <h3 className="text-white text-xl font-bold">
                              {movie.title}
                            </h3>
                          ) : (
                            <h4 className="text-white text-sm font-semibold">
                              {movie.title}
                            </h4>
                          )}
                          {(isLarge || isMedium) && (
                              <span className="text-white/70 text-sm mt-1 line-clamp-2" >{movie.description.replace(/<[^>]*>?/gm, '')}</span>
                          )}
                        </div>
                        <div className="ml-2 p-3 rounded-full bg-primary/80 group-hover:bg-primary transition-colors flex-shrink-0">
                          <Play className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>


          <Separator className="my-12 bg-gray-800" />

          <section>
            <h2 className="text-3xl font-bold font-serif mb-8 flex items-center gap-3"><Users /> Popular Artists</h2>
            <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-4">
              {users.map(user => {
                 const userAvatarUrl = user.image || userAvatarPlaceholder?.imageUrl;
                return (
                  <Link href={`/profile/${user.id}`} key={user.id} className="flex flex-col items-center group">
                    <Avatar className="w-24 h-24 text-4xl border-2 border-transparent group-hover:border-primary transition-colors">
                      {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={user.name || 'User'} />}
                       <AvatarFallback>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='text-center mt-2'>
                      <h3 className="font-semibold group-hover:text-primary">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.role === 'USER' ? 'Artist' : user.role.replace('_', ' ')}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

        </main>
    </div>
  );
}


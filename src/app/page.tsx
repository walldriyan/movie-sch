
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
    <div className="relative min-h-screen w-full bg-[#0a0a0a] text-gray-200 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-1/4 left-0 w-[50rem] h-[50rem] rounded-full bg-rose-900/50 filter blur-3xl opacity-20"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-[50rem] h-[50rem] rounded-full bg-blue-900/50 filter blur-3xl opacity-20"></div>
          <div className="absolute -bottom-1/2 left-1/4 w-[40rem] h-[40rem] rounded-full bg-green-900/50 filter blur-3xl opacity-15"></div>
        </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {movies.map((movie, index) => {
                const movieImageUrl =
                  movie.posterUrl ||
                  PlaceHolderImages.find(
                    (p) => p.id === 'movie-poster-placeholder'
                  )?.imageUrl;

                return (
                  <Link
                    href={`/movies/${movie.id}`}
                    key={movie.id}
                    className={cn(
                      'relative block overflow-hidden rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] cursor-pointer group bg-[#0b0d0f] transition-all duration-300',
                      'hover:shadow-lg hover:shadow-primary/20',
                      (index === 0 || index === 5) && 'md:col-span-2 md:row-span-2'
                    )}
                  >
                    {movieImageUrl && (
                      <Image
                        src={movieImageUrl}
                        alt={movie.title}
                        width={500}
                        height={750}
                        className="w-full h-full object-cover transition-transform duration-300 transform group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white text-sm font-semibold">{movie.title}</h3>
                          <div className="ml-2 p-2 rounded-full bg-primary/80 group-hover:bg-primary transition-colors">
                            <Play className="h-4 w-4 text-white" />
                          </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {users.map(user => {
                 const userAvatarUrl = user.image || userAvatarPlaceholder?.imageUrl;
                return (
                  <Link href={`/profile/${user.id}`} key={user.id} className="flex flex-col items-center gap-3 group">
                    <Avatar className="w-24 h-24 text-4xl border-2 border-transparent group-hover:border-primary transition-colors">
                      {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={user.name || 'User'} />}
                       <AvatarFallback>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='text-center'>
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

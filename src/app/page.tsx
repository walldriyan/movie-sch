'use server';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Film, Globe, Star, Tv, SlidersHorizontal, CalendarClock, CalendarDays, CalendarCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMovies, getUsers } from '@/lib/actions';
import type { Movie, User } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import type { FilterState } from '@/components/advanced-filter-dialog';
import { format, formatRelative } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';


export default async function HomePage({ searchParams }: { searchParams?: { timeFilter?: string } }) {
  const timeFilter = searchParams?.timeFilter;

  const { movies: fetchedMovies } = await getMovies({ filters: { timeFilter } });
  const movies = fetchedMovies as any[];
  const users = (await getUsers()) as User[];

  const authorAvatarPlaceholder = PlaceHolderImages.find((img) => img.id === 'avatar-1');
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
      <TooltipProvider>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar">
              <Button variant={'secondary'} className="rounded-full">
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
          
          <div className="flex items-center justify-between mb-8 overflow-hidden">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                  <Button asChild variant={timeFilter === 'today' ? 'secondary' : 'ghost'} size="sm" className="rounded-full whitespace-nowrap">
                    <Link href="/?timeFilter=today">
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Today
                    </Link>
                  </Button>
                  <Button asChild variant={timeFilter === 'this_week' ? 'secondary' : 'ghost'} size="sm" className="rounded-full whitespace-nowrap">
                    <Link href="/?timeFilter=this_week">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      This Week
                    </Link>
                  </Button>
                  <Button asChild variant={timeFilter === 'this_month' ? 'secondary' : 'ghost'} size="sm" className="rounded-full whitespace-nowrap">
                    <Link href="/?timeFilter=this_month">
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      This Month
                    </Link>
                  </Button>
                   {timeFilter && (
                     <Button asChild variant="ghost" size="sm" className="rounded-full whitespace-nowrap text-destructive">
                        <Link href="/">Clear</Link>
                    </Button>
                   )}
              </div>
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {movies.map((movie, index) => {
              const movieImageUrl =
                movie.posterUrl ||
                PlaceHolderImages.find(
                  (p) => p.id === 'movie-poster-placeholder'
                )?.imageUrl;
              
              const authorAvatarUrl = movie.author?.image || authorAvatarPlaceholder?.imageUrl;

              return (
                <Card 
                  key={movie.id} 
                  className={cn(
                    "overflow-hidden group relative flex flex-col justify-end min-h-[450px]",
                    index === 0 && "lg:col-span-1 lg:row-span-2 min-h-[600px]" // Make first card taller on large screens
                  )}
                >
                   {movieImageUrl && (
                      <Image
                        src={movieImageUrl}
                        alt={movie.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                  
                  <div className="relative p-6 text-white z-10">
                      <Link href={`/movies/${movie.id}`} className="block">
                        <h2 className="font-serif text-2xl font-bold leading-snug group-hover:text-primary transition-colors">
                            {movie.title}
                        </h2>
                      </Link>
                      <div
                        className="prose prose-sm text-white/80 mt-2 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: movie.description }}
                      />

                      <Separator className='my-4 bg-white/20' />
                      
                      <div className="flex items-center justify-between text-sm">
                        <Link
                          href={`/profile/${movie.author.id}`}
                          className="flex items-center gap-3 group/author"
                        >
                          <Avatar className="w-8 h-8">
                            {authorAvatarUrl && (
                              <AvatarImage
                                src={authorAvatarUrl}
                                alt={movie.author.name || 'Author'}
                                data-ai-hint="person face"
                              />
                            )}
                            <AvatarFallback>{movie.author.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-white group-hover/author:text-primary">
                            {movie.author.name}
                          </span>
                        </Link>
                         <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span>{movie.imdbRating.toFixed(1)}</span>
                        </div>
                      </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Separator className="my-12" />

          <section>
            <h2 className="text-3xl font-bold font-serif mb-8 flex items-center gap-3"><Users /> Popular Artists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {users.map(user => {
                 const userAvatarUrl = user.image || userAvatarPlaceholder?.imageUrl;
                return (
                  <Link href={`/profile/${user.id}`} key={user.id} className="flex flex-col items-center gap-3 group">
                    <Avatar className="w-24 h-24 text-4xl">
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
      </TooltipProvider>
    </div>
  );
}

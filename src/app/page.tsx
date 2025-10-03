
'use server';

import { Button } from '@/components/ui/button';
import { Film, Globe, Tv, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getMovies, getUsers } from '@/lib/actions';
import type { User } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import MovieGrid from '@/components/movie-grid';
import { PlaceHolderImages } from '@/lib/placeholder-images';


export default async function HomePage({ searchParams }: { searchParams?: { timeFilter?: string, page?: string } }) {
  const timeFilter = searchParams?.timeFilter;
  const currentPage = Number(searchParams?.page) || 1;

  const { movies: fetchedMovies, totalPages } = await getMovies({ page: currentPage, limit: 10, filters: { timeFilter } });
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
          
          <MovieGrid movies={movies} />

            {totalPages > 1 && (
              <Pagination className="mt-12">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href={`/?page=${currentPage - 1}`}
                      className={cn(
                        "dark bg-gray-800 hover:bg-gray-700",
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </PaginationPrevious>
                  </PaginationItem>

                  <PaginationItem>
                    <Link href="#" className="px-4 py-2 rounded-md text-sm font-medium">
                      All Posts
                    </Link>
                  </PaginationItem>
                  
                  <PaginationItem>
                    <PaginationNext
                      href={`/?page=${currentPage + 1}`}
                      className={cn(
                        "dark bg-gray-800 hover:bg-gray-700",
                        currentPage === totalPages && "pointer-events-none opacity-50"
                      )}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}


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

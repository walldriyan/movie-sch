

'use server';

import { Button } from '@/components/ui/button';
import { Film, Globe, Tv, Users, ChevronLeft, ChevronRight, ListFilter, Calendar, Clock, Star, ArrowDown, ArrowUp, Clapperboard, Folder } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPosts, getUsers } from '@/lib/actions';
import type { User } from '@/lib/types';
import { PostType } from '@prisma/client';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import PostGrid from '@/components/post-grid';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


export default async function HomePage({ searchParams }: { searchParams?: { timeFilter?: string, page?: string, sortBy?: string, type?: string } }) {
  const timeFilter = searchParams?.timeFilter;
  const sortBy = searchParams?.sortBy;
  const typeFilter = searchParams?.type;
  const currentPage = Number(searchParams?.page) || 1;

  const { posts: fetchedPosts, totalPages } = await getPosts({ page: currentPage, limit: 10, filters: { timeFilter, sortBy, type: typeFilter } });
  const posts = fetchedPosts as any[];
  const users = (await getUsers()) as User[];
  
  const userAvatarPlaceholder = PlaceHolderImages.find(
    (img) => img.id === 'avatar-4'
  );
  
  if (posts.length === 0) {
    return (
      <div className="w-full bg-background text-foreground">
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 text-center mt-16">
          <div className="max-w-md">
            <h1 className="font-serif text-4xl font-bold">
              No Posts Found
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              No posts match the current filters. Try a different filter.
            </p>
             <Button asChild className="mt-8">
                <Link href="/">Clear Filters</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const buildQueryString = (params: Record<string, string | number | undefined>) => {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        searchParams.set(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '/';
  }

  const typeFilters = [
    { label: 'Movies', value: PostType.MOVIE, icon: <Clapperboard /> },
    { label: 'TV Series', value: PostType.TV_SERIES, icon: <Tv /> },
    { label: 'Other', value: PostType.OTHER, icon: <Folder /> },
  ]

  return (
    <div className="w-full bg-background text-foreground">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <Button asChild variant={!typeFilter ? 'secondary' : 'outline'} className="rounded-full bg-transparent border-gray-700 hover:bg-gray-800">
                  <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: undefined })}>
                    <Film />
                    <span>All</span>
                  </Link>
                </Button>
                 {typeFilters.map(filter => (
                    <Button key={filter.value} asChild variant={typeFilter === filter.value ? 'secondary' : 'outline'} className="rounded-full bg-transparent border-gray-700 hover:bg-gray-800">
                      <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: filter.value })}>
                        {filter.icon}
                        <span>{filter.label}</span>
                      </Link>
                    </Button>
                 ))}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full bg-transparent border-gray-700 hover:bg-gray-800">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                  <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'updatedAt-desc', type: typeFilter })}>
                    <DropdownMenuRadioItem value="newest" checked={sortBy === 'updatedAt-desc' || !sortBy}>
                      <Clock className="mr-2 h-4 w-4" /> Newest
                    </DropdownMenuRadioItem>
                  </Link>
                   <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'updatedAt-asc', type: typeFilter })}>
                    <DropdownMenuRadioItem value="oldest" checked={sortBy === 'updatedAt-asc'}>
                      <Clock className="mr-2 h-4 w-4" /> Oldest
                    </DropdownMenuRadioItem>
                  </Link>
                  <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'imdbRating-desc', type: typeFilter })}>
                    <DropdownMenuRadioItem value="imdb" checked={sortBy === 'imdbRating-desc'}>
                      <Star className="mr-2 h-4 w-4" /> IMDb Rating
                    </DropdownMenuRadioItem>
                  </Link>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by date</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'today', type: typeFilter })}>
                    <DropdownMenuRadioItem value="today" checked={timeFilter === 'today'}>
                      <Calendar className="mr-2 h-4 w-4" /> Today
                    </DropdownMenuRadioItem>
                  </Link>
                  <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'this_week', type: typeFilter })}>
                    <DropdownMenuRadioItem value="this_week" checked={timeFilter === 'this_week'}>
                      <Calendar className="mr-2 h-4 w-4" /> This Week
                    </DropdownMenuRadioItem>
                  </Link>
                  <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'this_month', type: typeFilter })}>
                    <DropdownMenuRadioItem value="this_month" checked={timeFilter === 'this_month'}>
                      <Calendar className="mr-2 h-4 w-4" /> This Month
                    </DropdownMenuRadioItem>
                  </Link>
                  <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'all', type: typeFilter })}>
                    <DropdownMenuRadioItem value="all" checked={timeFilter === 'all' || !timeFilter}>
                      <Calendar className="mr-2 h-4 w-4" /> All Time
                    </DropdownMenuRadioItem>
                  </Link>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
          
          <PostGrid posts={posts} />

            {totalPages > 1 && (
              <Pagination className="mt-12">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href={buildQueryString({ sortBy, timeFilter, page: currentPage - 1, type: typeFilter })}
                      className={cn(
                        "dark bg-gray-800 hover:bg-gray-700",
                        currentPage === 1 && "pointer-events-none opacity-50"
                      )}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </PaginationPrevious>
                  </PaginationItem>

                  <PaginationItem>
                    <span className="px-4 py-2 rounded-md text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                  </PaginationItem>
                  
                  <PaginationItem>
                    <PaginationNext
                      href={buildQueryString({ sortBy, timeFilter, page: currentPage + 1, type: typeFilter })}
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

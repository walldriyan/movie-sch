
'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Film, Globe, Tv, Users, ChevronLeft, ChevronRight, ListFilter, Calendar, Clock, Star, ArrowDown, ArrowUp, Clapperboard, Folder, Terminal, Bell, Check, Info, Lock, Image as ImageIcon, Link2, X, ArrowRight, Copyright, Mail, Phone, MapPin, Twitter, Youtube, Linkedin, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User, Post, GroupWithCount, MicroPost as MicroPostType } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
import { TooltipProvider } from '@/components/ui/tooltip';
import GroupCard from './group-card';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Session } from 'next-auth';
import { Skeleton } from './ui/skeleton';
import PostGrid from './post-grid';
import { ROLES } from '@/lib/permissions';
import MetaSpotlightHero from './meta-spotlight-hero';
import Image from 'next/image';

const ViralCommerceSection = () => {
    return (
        <section className="py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="flex items-center justify-center gap-4">
                    <div className="w-48 h-48 bg-gray-800/50 rounded-2xl flex items-center justify-center p-4">
                         <Image src="https://placehold.co/150x150/000000/FFFFFF/png?text=Before" alt="Before" width={150} height={150} className="rounded-lg" />
                    </div>
                    <ArrowRight className="w-8 h-8 text-yellow-400" />
                     <div className="w-64 h-64 bg-gray-800/50 rounded-2xl flex items-center justify-center p-4">
                        <Image src="https://placehold.co/220x220/000000/FFFFFF/png?text=After" alt="After" width={220} height={220} className="rounded-lg" />
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold">Viral Commerce</h2>
                    <p className="text-yellow-400 font-semibold mt-2">FOR: ECOMMERCE BRANDS, AGENCIES</p>
                    <h3 className="text-2xl md:text-3xl font-semibold mt-6">Amplify Your Brand's Presence with Scroll-Stopping Motion Ads</h3>
                    <p className="text-muted-foreground mt-4">
                        We turn your static assets into dynamic motion ads for every platform and format, ensuring maximum impact and engagement.
                    </p>
                    <Button className="mt-8 bg-yellow-400 text-black hover:bg-yellow-500">
                        Book a Call
                    </Button>
                </div>
            </div>
        </section>
    );
};

const ViralContentSection = () => {
    return (
        <section className="py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold">Viral Content</h2>
                    <p className="text-yellow-400 font-semibold mt-2">FOR: ANY BRANDS, AGENCIES</p>
                    <h3 className="text-2xl md:text-3xl font-semibold mt-6">Transform Your Content for Every Platform</h3>
                </div>
                 <div className="flex items-center justify-center">
                    <div className="w-80 h-80 bg-gray-800/50 rounded-2xl flex items-center justify-center p-4">
                        <Image src="https://placehold.co/300x300/000000/FFFFFF/png?text=Content" alt="Viral Content" width={300} height={300} className="rounded-lg" />
                    </div>
                </div>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="bg-zinc-950/70 text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     {/* Column 1: Logo and Socials */}
                     <div className="space-y-4">
                         <div className="flex items-center space-x-2">
                             <Film className="h-8 w-8 text-primary" />
                             <span className="font-bold text-xl">CineVerse</span>
                         </div>
                         <p className="text-sm text-muted-foreground">a Walldriyan.inc company</p>
                         <p className="text-sm text-muted-foreground pt-2">CineVerse is a top-tier content production studio for the platform age.</p>
                         <div className="flex items-center space-x-3 pt-2">
                            <Link href="#"><Facebook className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
                            <Link href="#"><Instagram className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
                            <Link href="#"><Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
                            <Link href="#"><Youtube className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
                            <Link href="#"><Twitter className="h-5 w-5 text-muted-foreground hover:text-primary" /></Link>
                         </div>
                     </div>

                     {/* Column 2: Quick Links */}
                     <div>
                         <h3 className="font-semibold text-white mb-4">Quick Links</h3>
                         <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">About</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Solutions</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Resources</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Contact</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary flex items-center gap-1">Content Archive <ExternalLink className="h-3 w-3" /></Link></li>
                         </ul>
                     </div>

                     {/* Column 3: Solutions */}
                     <div>
                         <h3 className="font-semibold text-white mb-4">Solutions</h3>
                         <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Viral Exec</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Viral Commerce</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Viral Content</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Short Form Videos</Link></li>
                         </ul>
                     </div>

                    {/* Column 4: Contact */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Contact</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>123 Movie Lane,<br/>Hollywood, CA 90210</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <a href="mailto:info@cineverse.com" className="hover:text-primary">info@cineverse.com</a>
                        </li>
                        <li className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <a href="tel:+123456789" className="hover:text-primary">+1 (234) 567-89</a>
                        </li>
                        </ul>
                    </div>
                 </div>

                 <Separator className="my-8 bg-border/50" />

                 <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><Copyright className="h-4 w-4" /> {new Date().getFullYear()} CineVerse. All rights reserved.</p>
                     <div className="flex items-center gap-4 mt-4 sm:mt-0">
                         <Link href="#" className="hover:text-primary">Privacy Policy</Link>
                         <Link href="#" className="hover:text-primary">Cookie Policy</Link>
                     </div>
                 </div>
            </div>
        </footer>
    );
};


interface HomePageClientProps {
    initialPosts: any[];
    initialUsers: User[];
    initialGroups: (GroupWithCount & { posts: { posterUrl: string | null }[] })[];
    totalPages: number;
    currentPage: number;
    searchParams?: { timeFilter?: string, page?: string, sortBy?: string, type?: string, lockStatus?: string };
    session: Session | null;
}

export default function HomePageClient({ 
    initialPosts, 
    initialUsers, 
    initialGroups, 
    totalPages, 
    currentPage, 
    searchParams,
    session,
}: HomePageClientProps) {
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for better UX with skeletons
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const posts = initialPosts;
  const users = initialUsers;
  const groups = initialGroups;
  const timeFilter = searchParams?.timeFilter;
  const sortBy = searchParams?.sortBy;
  const typeFilter = searchParams?.type;
  const lockStatus = searchParams?.lockStatus;


  const userAvatarPlaceholder = PlaceHolderImages.find(
    (img) => img.id === 'avatar-4'
  );
  
  const buildQueryString = (params: Record<string, string | number | undefined | null>) => {
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
    { label: 'Movies', value: 'MOVIE', icon: <Clapperboard className="w-4 h-4" /> },
    { label: 'TV Series', value: 'TV_SERIES', icon: <Tv className="w-4 h-4" /> },
    { label: 'Other', value: 'OTHER', icon: <Folder className="w-4 h-4" /> },
  ]
  
  const isPrivilegedUser = session?.user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role);


  return (
    <TooltipProvider>
      <div className="w-full bg-background text-foreground">
        <MetaSpotlightHero posts={posts} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 pt-0">
            <ViralCommerceSection />
            <Separator className="my-8 bg-gray-800" />
            <ViralContentSection />
            <Separator className="my-8 bg-gray-800" />

          <div className="max-w-4xl mx-auto pb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <Button asChild variant={'outline'} className={cn(
                    "rounded-full hover:bg-gray-800 flex-shrink-0",
                    !typeFilter && !lockStatus ? 'bg-gray-800 border-gray-600' : 'border-gray-700 bg-transparent'
                )}>
                <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: undefined, lockStatus: undefined })} scroll={false} className="flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    <span>All</span>
                </Link>
                </Button>
                {typeFilters.map(filter => (
                    <Button key={filter.value} asChild variant={'outline'} className={cn(
                    "rounded-full hover:bg-gray-800 flex-shrink-0",
                    typeFilter === filter.value && !lockStatus ? 'bg-gray-800 border-gray-600' : 'border-gray-700 bg-transparent'
                    )}>
                    <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: filter.value, lockStatus: undefined })} scroll={false} className="flex items-center gap-2">
                        {filter.icon}
                        <span>{filter.label}</span>
                    </Link>
                    </Button>
                ))}
                  <Button asChild variant={'outline'} className={cn(
                  "rounded-full hover:bg-gray-800 flex-shrink-0",
                  lockStatus === 'locked' ? 'bg-gray-800 border-gray-600' : 'border-gray-700 bg-transparent'
                )}>
                  <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: undefined, lockStatus: 'locked' })} scroll={false} className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Locked</span>
                  </Link>
                </Button>
            </div>
            
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full bg-transparent border-gray-700 hover:bg-gray-800 ml-2 flex-shrink-0">
                <ListFilter className="mr-2 h-4 w-4" />
                Filter
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'updatedAt-desc', type: typeFilter, lockStatus })} scroll={false}>
                    <DropdownMenuRadioItem value="newest" checked={sortBy === 'updatedAt-desc' || !sortBy}>
                    <Clock className="mr-2 h-4 w-4" /> Newest
                    </DropdownMenuRadioItem>
                </Link>
                <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'updatedAt-asc', type: typeFilter, lockStatus })} scroll={false}>
                    <DropdownMenuRadioItem value="oldest" checked={sortBy === 'updatedAt-asc'}>
                    <Clock className="mr-2 h-4 w-4" /> Oldest
                    </DropdownMenuRadioItem>
                </Link>
                <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'imdbRating-desc', type: typeFilter, lockStatus })} scroll={false}>
                    <DropdownMenuRadioItem value="imdb" checked={sortBy === 'imdbRating-desc'}>
                    <Star className="mr-2 h-4 w-4" /> IMDb Rating
                    </DropdownMenuRadioItem>
                </Link>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by date</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'today', type: typeFilter, lockStatus })} scroll={false}>
                    <DropdownMenuRadioItem value="today" checked={timeFilter === 'today'}>
                    <Calendar className="mr-2 h-4 w-4" /> Today
                    </DropdownMenuRadioItem>
                </Link>
                <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'this_week', type: typeFilter, lockStatus })} scroll={false}>
                    <DropdownMenuRadioItem value="this_week" checked={timeFilter === 'this_week'}>
                    <Calendar className="mr-2 h-4 w-4" /> This Week
                    </DropdownMenuRadioItem>
                </Link>
                <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'this_month', type: typeFilter, lockStatus })} scroll={false}>
                    <DropdownMenuRadioItem value="this_month" checked={timeFilter === 'this_month'}>
                    <Calendar className="mr-2 h-4 w-4" /> This Month
                    </DropdownMenuRadioItem>
                </Link>
                <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'all', type: typeFilter, lockStatus })} scroll={false}>
                    <DropdownMenuRadioItem value="all" checked={timeFilter === 'all' || !timeFilter}>
                    <Calendar className="mr-2 h-4 w-4" /> All Time
                    </DropdownMenuRadioItem>
                </Link>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {posts.length === 0 && !loading ? (
                <div className="text-center py-16">
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
            ) : (
            <>
              <PostGrid posts={posts} />

              {totalPages > 1 && (
              <Pagination className="mt-12">
                  <PaginationContent>
                  <PaginationItem>
                      <PaginationPrevious 
                      href={buildQueryString({ sortBy, timeFilter, page: currentPage - 1, type: typeFilter, lockStatus })}
                      scroll={false}
                      className={cn(
                          "dark bg-gray-800 hover:bg-gray-700",
                          currentPage <= 1 && "pointer-events-none opacity-50"
                      )}
                      >
                      </PaginationPrevious>
                  </PaginationItem>

                  <PaginationItem>
                      <span className="px-4 py-2 rounded-md text-sm font-medium">
                      Page {currentPage} of {totalPages}
                      </span>
                  </PaginationItem>
                  
                  <PaginationItem>
                      <PaginationNext
                      href={buildQueryString({ sortBy, timeFilter, page: currentPage + 1, type: typeFilter, lockStatus })}
                      scroll={false}
                      className={cn(
                          "dark bg-gray-800 hover:bg-gray-700",
                          currentPage >= totalPages && "pointer-events-none opacity-50"
                      )}
                      >
                      </PaginationNext>
                  </PaginationItem>
                  </PaginationContent>
              </Pagination>
              )}


              <Separator className="my-12 bg-gray-800" />

              <section>
                  <h2 className="text-3xl font-bold font-serif mb-8 flex items-center gap-3"><Users /> Popular Artists</h2>
                   {loading ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-8 gap-y-4">
                          {[...Array(5)].map((_, i) => (
                              <div key={i} className="flex flex-col items-center">
                                  <Skeleton className="w-24 h-24 rounded-full" />
                                  <Skeleton className="h-4 w-20 mt-2" />
                                  <Skeleton className="h-3 w-16 mt-1" />
                              </div>
                          ))}
                      </div>
                  ) : users.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 justify-center gap-x-8 gap-y-4">
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
                  ) : (
                       <div className="flex flex-col items-center justify-center text-center p-16 border-2 border-dashed rounded-lg bg-muted/20">
                          <Users className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold">No Users Yet</h3>
                          <p className="text-muted-foreground mt-2 text-sm">There are no users in the system yet.</p>
                      </div>
                  )}
              </section>
              
              <Separator className="my-12 bg-gray-800" />

              <section>
                  <h2 className="text-3xl font-bold font-serif mb-8 flex items-center gap-3"><Globe /> Popular Groups</h2>
                   {loading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                         {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-lg" />)}
                      </div>
                  ) : groups.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {groups.map((group) => (
                            <GroupCard key={group.id} group={group} />
                          ))}
                      </div>
                  ) : (
                       <div className="flex flex-col items-center justify-center text-center p-16 border-2 border-dashed rounded-lg bg-muted/20">
                          <Users className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold">No Groups Yet</h3>
                          <p className="text-muted-foreground mt-2 text-sm">There are no public groups available at the moment. Check back later!</p>
                      </div>
                  )}
              </section>
            </>
          )}
        </main>
        <Footer />
      </div>
    </TooltipProvider>
  );
}

// Define ExternalLink icon component locally
const ExternalLink = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" x2="21" y1="14" y2="3" />
  </svg>
);

    

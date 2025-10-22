
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Film, Globe, Tv, Users, ChevronLeft, ChevronRight, ListFilter, Calendar, Clock, Star, ArrowDown, ArrowUp, Clapperboard, Folder, Terminal, Bell, Check, Info, Lock, Image as ImageIcon, Link2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User, Post, GroupWithCount } from '@/lib/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Notification as NotificationType } from '@prisma/client';
import { updateNotificationStatus, createMicroPost } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Session } from 'next-auth';
import { Skeleton } from './ui/skeleton';
import PostGrid from './post-grid';
import { ROLES } from '@/lib/permissions';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { Input } from './ui/input';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';


interface HomePageClientProps {
    initialPosts: any[];
    initialUsers: User[];
    initialGroups: (GroupWithCount & { posts: { posterUrl: string | null }[] })[];
    totalPages: number;
    currentPage: number;
    searchParams?: { timeFilter?: string, page?: string, sortBy?: string, type?: string, lockStatus?: string };
    initialNotifications: NotificationType[];
    session: Session | null;
}

const microPostSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty.').max(500, 'Post cannot exceed 500 characters.'),
  tags: z.string().optional(),
});

type MicroPostFormValues = z.infer<typeof microPostSchema>;


const NotificationIcon = ({ type }: { type: NotificationType['type']}) => {
    switch (type) {
        case 'FEATURE':
            return <Terminal className="h-4 w-4" />;
        case 'INFO':
            return <Info className="h-4 w-4" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
}

function CreateMicroPost() {
    const { data: session } = useSession();
    const user = session?.user;
    const { toast } = useToast();
    const [isSubmitting, startTransition] = useTransition();

    const form = useForm<MicroPostFormValues>({
      resolver: zodResolver(microPostSchema),
      defaultValues: {
        content: '',
        tags: '',
      }
    });

    const userAvatar = user?.image || PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

    if (!user) return null;

    const onSubmit = (values: MicroPostFormValues) => {
      startTransition(async () => {
        try {
          const tagsArray = values.tags ? values.tags.split(',').map(tag => tag.trim()) : [];
          await createMicroPost(values.content, tagsArray);
          toast({ title: 'Success', description: 'Your post has been published.' });
          form.reset();
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
      });
    }

    return (
        <Card className="mb-8">
            <CardContent className="p-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={userAvatar} />
                        <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="w-full space-y-3">
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                    placeholder="What's happening?"
                                    className="w-full bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base"
                                    rows={2}
                                    {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Add tags (comma-separated)" className="text-xs h-8" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-between items-center pt-2">
                            <div className="flex gap-1 text-muted-foreground">
                                <Button variant="ghost" size="icon" type="button"><ImageIcon className="h-5 w-5" /></Button>
                                <Button variant="ghost" size="icon" type="button"><Link2 className="h-5 w-5" /></Button>
                            </div>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Post
                            </Button>
                        </div>
                    </div>
                  </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function HomePageClient({ 
    initialPosts, 
    initialUsers, 
    initialGroups, 
    totalPages, 
    currentPage, 
    searchParams,
    initialNotifications,
    session
}: HomePageClientProps) {
  
  const [notifications, setNotifications] = useState<NotificationType[]>(initialNotifications.map(n => ({...n, createdAt: new Date(n.createdAt), updatedAt: new Date(n.updatedAt)})));
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for better UX with skeletons
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
        try {
            await updateNotificationStatus(id, 'READ');
            setNotifications(currentNotifications => 
                currentNotifications.map(n => n.id === id ? { ...n, status: 'READ' } : n)
            );
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to mark notification as read.'
            })
            console.error('--- [HomePageClient] handleMarkAsRead: Error ---', error);
        }
    });
  };
  
  const unreadCount = notifications.filter(n => n.status !== 'READ').length;
  
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

  const renderNotifications = (items: NotificationType[]) => {
    if (items.length === 0) {
      return <p className="text-muted-foreground text-sm text-center p-4">No notifications here.</p>
    }
    return (
      <div className="space-y-3">
        {items.map(notification => (
          <div key={notification.id} className="flex items-center gap-4">
             <div className={cn("text-primary", notification.status === 'READ' && "text-muted-foreground")}>
                <NotificationIcon type={notification.type} />
             </div>
            <div className="flex-grow">
              <p className={cn("font-semibold text-sm", notification.status === 'READ' && "text-muted-foreground")}>{notification.title}</p>
              <p className="text-xs text-muted-foreground">{notification.message}</p>
            </div>
            {notification.status !== 'READ' && (
              <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)} disabled={isPending}>
                <Check className="h-4 w-4 mr-2" /> Mark as read
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  }
  
  const isPrivilegedUser = session?.user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role);
  const allButtonLockStatus = isPrivilegedUser ? null : 'unlocked';


  return (
    <TooltipProvider>
      <div className="w-full bg-background text-foreground">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 pt-0">
          <Tabs defaultValue="discover" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="discover">Discover</TabsTrigger>
              <TabsTrigger value="news">News</TabsTrigger>
            </TabsList>
            
            <TabsContent value="news">
              <CreateMicroPost />
               <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <h1 className="font-serif text-2xl font-bold text-muted-foreground">
                    News Feed Coming Soon
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This section will show micro-posts from users you follow.
                  </p>
                </div>
            </TabsContent>

            <TabsContent value="discover">
               <div className="max-w-4xl mx-auto pb-8 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <Button asChild variant={'outline'} className={cn(
                        "rounded-full hover:bg-gray-800 flex-shrink-0",
                        !typeFilter && (!lockStatus || lockStatus === 'unlocked') ? 'bg-gray-800 border-gray-600' : 'border-gray-700 bg-transparent'
                    )}>
                    <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: undefined, lockStatus: allButtonLockStatus })} className="flex items-center gap-2">
                        <Film className="w-4 h-4" />
                        <span>All</span>
                    </Link>
                    </Button>
                    {typeFilters.map(filter => (
                        <Button key={filter.value} asChild variant={'outline'} className={cn(
                        "rounded-full hover:bg-gray-800 flex-shrink-0",
                        typeFilter === filter.value ? 'bg-gray-800 border-gray-600' : 'border-gray-700 bg-transparent'
                        )}>
                        <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: filter.value, lockStatus })} className="flex items-center gap-2">
                            {filter.icon}
                            <span>{filter.label}</span>
                        </Link>
                        </Button>
                    ))}
                      <Button asChild variant={'outline'} className={cn(
                      "rounded-full hover:bg-gray-800 flex-shrink-0",
                      lockStatus === 'locked' ? 'bg-gray-800 border-gray-600' : 'border-gray-700 bg-transparent'
                    )}>
                      <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: typeFilter, lockStatus: 'locked' })} className="flex items-center gap-2">
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
                    <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'updatedAt-desc', type: typeFilter, lockStatus })}>
                        <DropdownMenuRadioItem value="newest" checked={sortBy === 'updatedAt-desc' || !sortBy}>
                        <Clock className="mr-2 h-4 w-4" /> Newest
                        </DropdownMenuRadioItem>
                    </Link>
                    <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'updatedAt-asc', type: typeFilter, lockStatus })}>
                        <DropdownMenuRadioItem value="oldest" checked={sortBy === 'updatedAt-asc'}>
                        <Clock className="mr-2 h-4 w-4" /> Oldest
                        </DropdownMenuRadioItem>
                    </Link>
                    <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'imdbRating-desc', type: typeFilter, lockStatus })}>
                        <DropdownMenuRadioItem value="imdb" checked={sortBy === 'imdbRating-desc'}>
                        <Star className="mr-2 h-4 w-4" /> IMDb Rating
                        </DropdownMenuRadioItem>
                    </Link>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Filter by date</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'today', type: typeFilter, lockStatus })}>
                        <DropdownMenuRadioItem value="today" checked={timeFilter === 'today'}>
                        <Calendar className="mr-2 h-4 w-4" /> Today
                        </DropdownMenuRadioItem>
                    </Link>
                    <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'this_week', type: typeFilter, lockStatus })}>
                        <DropdownMenuRadioItem value="this_week" checked={timeFilter === 'this_week'}>
                        <Calendar className="mr-2 h-4 w-4" /> This Week
                        </DropdownMenuRadioItem>
                    </Link>
                    <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'this_month', type: typeFilter, lockStatus })}>
                        <DropdownMenuRadioItem value="this_month" checked={timeFilter === 'this_month'}>
                        <Calendar className="mr-2 h-4 w-4" /> This Month
                        </DropdownMenuRadioItem>
                    </Link>
                    <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'all', type: typeFilter, lockStatus })}>
                        <DropdownMenuRadioItem value="all" checked={timeFilter === 'all' || !timeFilter}>
                        <Calendar className="mr-2 h-4 w-4" /> All Time
                        </DropdownMenuRadioItem>
                    </Link>
                </DropdownMenuContent>
                </DropdownMenu>

            </div>
              {posts.length === 0 ? (
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
                {session && unreadCount > 0 && (
                  <Card className="mb-8">
                    <CardContent className="p-4">
                       <Tabs defaultValue="unread">
                          <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="unread">
                                Unread {unreadCount > 0 && <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">{unreadCount}</span>}
                              </TabsTrigger>
                              <TabsTrigger value="all">All</TabsTrigger>
                          </TabsList>
                          <TabsContent value="unread" className="mt-4">
                              {renderNotifications(notifications.filter(n => n.status !== 'READ'))}
                          </TabsContent>
                          <TabsContent value="all" className="mt-4">
                              {renderNotifications(notifications)}
                          </TabsContent>
                        </Tabs>
                    </CardContent>
                  </Card>
                )}
                
                <PostGrid posts={posts} />

                    {totalPages > 1 && (
                    <Pagination className="mt-12">
                        <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                            href={buildQueryString({ sortBy, timeFilter, page: currentPage - 1, type: typeFilter, lockStatus })}
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
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
}

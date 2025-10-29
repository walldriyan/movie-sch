
'use client';

import { useState, useEffect, useTransition } from 'react';
import { notFound } from 'next/navigation';
import { getNotifications, getPosts } from '@/lib/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Film, Loader2, ChevronsDown } from 'lucide-react';
import Link from 'next/link';
import ClientRelativeDate from '@/components/client-relative-date';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { Notification, Post } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';

const Timeline = ({ children }: { children: React.ReactNode }) => (
  <ol className="relative border-l border-gray-700 dark:border-gray-700 ml-3">{children}</ol>
);

const TimelineItem = ({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) => (
  <li className="mb-10 ml-6">
    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 ring-8 ring-background">
      {icon}
    </span>
    {children}
  </li>
);

const ActivityItem = ({ time, title, description, link }: { time: string, title: React.ReactNode, description?: string, link?: string }) => {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">
          {title}
        </h3>
        <time className="ml-4 flex-shrink-0 text-xs font-normal text-gray-500">
          <ClientRelativeDate date={time} />
        </time>
      </div>
      {description && <p className="text-sm font-normal text-gray-400 mt-1">{description}</p>}
    </>
  );

  const itemClass = "block rounded-lg p-3 bg-muted/30 hover:bg-muted/60 transition-colors";

  if (link) {
    return (
      <Link href={link} className={itemClass}>
        {content}
      </Link>
    )
  }

  return (
    <div className={itemClass}>
      {content}
    </div>
  )
};


const ActivityGroup = ({ title, icon, fetcher, initialItems, initialTotal }: {
    title: string;
    icon: React.ReactNode;
    fetcher: (page: number, limit: number) => Promise<{ items: any[], hasMore: boolean }>;
    initialItems: any[];
    initialTotal: number;
}) => {
    const [items, setItems] = useState<any[]>([]);
    const [page, setPage] = useState(1); 
    const [hasMore, setHasMore] = useState(initialItems.length < initialTotal);
    const [isPending, startTransition] = useTransition();

    const firstItem = initialItems[0];

    const loadMore = (nextPage: number) => {
        startTransition(async () => {
            const { items: newItems, hasMore: newHasMore } = await fetcher(nextPage, 10);
            setItems(prev => [...prev, ...newItems]);
            setHasMore(newHasMore);
            setPage(nextPage);
        });
    };
    
    const fetchInitialAccordionContent = () => {
        if (initialTotal > 1 && items.length === 0) {
           loadMore(1); 
        }
    }

    if (initialTotal === 0) return null;
    
    return (
        <TimelineItem icon={icon}>
            <div className="mb-3">
              {firstItem && (
                 <ActivityItem
                    key={`${title}-${firstItem.id}`}
                    time={firstItem.createdAt || firstItem.updatedAt}
                    title={title === 'Notifications' ? firstItem.title : <span className="text-primary">{firstItem.title}</span>}
                    description={title === 'Notifications' ? firstItem.message : `by ${firstItem.author?.name}`}
                    link={title === 'New Posts' ? `/movies/${firstItem.id}` : undefined}
                />
              )}
            </div>

            {initialTotal > 1 && (
                <Card className="bg-background/30 backdrop-blur-sm border-white/10">
                    <Accordion type="single" collapsible onValueChange={fetchInitialAccordionContent}>
                        <AccordionItem value="item-1" className="border-b-0">
                            <AccordionTrigger className="p-4 hover:no-underline text-sm">
                                <div className="flex items-center gap-3">
                                    {icon} View All {initialTotal} {title}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <div className="space-y-4">
                                    {isPending && items.length === 0 && <Loader2 className="mx-auto h-6 w-6 animate-spin" />}
                                    {items.map(item => (
                                        <ActivityItem
                                            key={`${title}-${item.id}`}
                                            time={item.createdAt || item.updatedAt}
                                            title={title === 'Notifications' ? item.title : <span className="text-primary">{item.title}</span>}
                                            description={title === 'Notifications' ? item.message : `by ${item.author?.name}`}
                                            link={title === 'New Posts' ? `/movies/${item.id}` : undefined}
                                        />
                                    ))}
                                    {hasMore && (
                                        <Button onClick={() => loadMore(page + 1)} disabled={isPending} variant="outline" className="w-full">
                                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronsDown className="mr-2 h-4 w-4" />}
                                            Load More
                                        </Button>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Card>
            )}
        </TimelineItem>
    )
}

export default function ActivityPage() {
  const { data: session, status } = useSession();
  const [initialData, setInitialData] = useState<{
      notifications: (Notification & { author?: any})[],
      posts: Post[],
      totalNotifs: number,
      totalPosts: number,
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchInitialData() {
        if (status === 'authenticated') {
            setIsLoading(true);
            const { items: initialNotifs, total: totalNotifs } = await getNotifications({ page: 1, limit: 1 });
            const { posts: initialPosts, totalPosts } = await getPosts({ page: 1, limit: 1 });
            setInitialData({
                notifications: initialNotifs as any[],
                posts: initialPosts as any[],
                totalNotifs,
                totalPosts,
            });
            setIsLoading(false);
        }
    }
    fetchInitialData();
  }, [status]);
  
  if (status === 'unauthenticated') {
      notFound();
  }

  const fetchMoreNotifications = async (page: number, limit: number) => {
      const { items, total } = await getNotifications({ page, limit });
      return { items: items.slice(1), hasMore: (page * limit) < total };
  }

  const fetchMorePosts = async (page: number, limit: number) => {
      const { posts, totalPosts } = await getPosts({ page: page, limit: limit + (page === 1 ? 1 : 0) });
      const itemsToReturn = page === 1 ? posts.slice(1) : posts;
      const hasMore = (page * limit) < totalPosts;
      return { items: itemsToReturn, hasMore: hasMore };
  }


  const renderContent = () => {
    if (isLoading || !initialData) {
      return (
        <div className="space-y-8">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      );
    }
    
    const { notifications, posts, totalNotifs, totalPosts } = initialData;
    const hasActivity = totalNotifs > 0 || totalPosts > 0;
    
    if (!hasActivity) {
      return (
        <Card className="text-center border-dashed">
            <CardContent className="p-16 flex flex-col items-center gap-4">
              <Bell className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No Activity Yet</h3>
              <p className="text-muted-foreground">
                Your recent notifications and updates will appear here.
              </p>
            </CardContent>
        </Card>
      );
    }

    return (
        <Timeline>
            {totalNotifs > 0 && (
                <ActivityGroup
                    title="Notifications"
                    icon={<Bell className="h-4 w-4" />}
                    fetcher={async (p, l) => {
                        const { items, total } = await getNotifications({ page: p, limit: l + (p === 1 ? 1 : 0) });
                        const itemsToReturn = p === 1 ? items.slice(1) : items;
                        return { items: itemsToReturn, hasMore: (p * l) < total };
                    }}
                    initialItems={notifications}
                    initialTotal={totalNotifs}
                />
            )}
            {totalPosts > 0 && (
                 <ActivityGroup
                    title="New Posts"
                    icon={<Film className="h-4 w-4" />}
                    fetcher={async (p, l) => {
                        const { posts, totalPosts } = await getPosts({ page: p, limit: l + (p === 1 ? 1 : 0) });
                        const itemsToReturn = p === 1 ? posts.slice(1) : posts;
                        return { items: itemsToReturn, hasMore: ((p - 1) * l + itemsToReturn.length + 1) < totalPosts };
                    }}
                    initialItems={posts}
                    initialTotal={totalPosts}
                />
            )}
        </Timeline>
    );
  }

  return (
    <main className="container mx-auto max-w-2xl py-12">
      <h1 className="mb-8 font-serif text-4xl font-bold">My Activity</h1>
      {renderContent()}
    </main>
  );
}

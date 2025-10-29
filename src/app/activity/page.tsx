import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { getNotifications, getPosts } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Film } from 'lucide-react';
import Link from 'next/link';
import ClientRelativeDate from '@/components/client-relative-date';

const Timeline = ({ children }: { children: React.ReactNode }) => (
  <ol className="relative border-l border-gray-700">{children}</ol>
);

const TimelineItem = ({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) => (
  <li className="mb-10 ml-6">
    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 ring-8 ring-gray-900">
      {icon}
    </span>
    {children}
  </li>
);

const GroupedActivityCard = ({ title, children }: { title: React.ReactNode, children: React.ReactNode }) => (
  <Card className="bg-background/30 backdrop-blur-sm border-white/10">
    <CardHeader>
      <CardTitle className="flex items-center gap-3">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
        {children}
    </CardContent>
  </Card>
)

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

  if (link) {
    return (
      <Link href={link} className="block rounded-lg p-3 bg-muted/30 hover:bg-muted/60 transition-colors">
        {content}
      </Link>
    )
  }

  return (
    <div className="rounded-lg p-3 bg-muted/30">
      {content}
    </div>
  )
};

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const notifications = await getNotifications();
  const { posts: recentPosts } = await getPosts({ limit: 5 });
  
  const hasActivity = notifications.length > 0 || recentPosts.length > 0;

  return (
    <main className="container mx-auto max-w-2xl py-12">
      <h1 className="mb-8 font-serif text-4xl font-bold">My Activity</h1>

      {hasActivity ? (
        <Timeline>
            {notifications.length > 0 && (
                <TimelineItem icon={<Bell className="h-3 w-3 text-blue-300" />}>
                    <GroupedActivityCard title={<>Notifications <span className="ml-2 text-sm font-normal text-muted-foreground">({notifications.length})</span></>}>
                        {notifications.map(notif => (
                            <ActivityItem 
                                key={`notif-${notif.id}`}
                                time={notif.createdAt as unknown as string}
                                title={notif.title}
                                description={notif.message}
                            />
                        ))}
                    </GroupedActivityCard>
                </TimelineItem>
            )}

            {recentPosts.length > 0 && (
                 <TimelineItem icon={<Film className="h-3 w-3 text-blue-300" />}>
                     <GroupedActivityCard title={<>New Posts <span className="ml-2 text-sm font-normal text-muted-foreground">({recentPosts.length})</span></>}>
                        {recentPosts.map(post => (
                            <ActivityItem 
                                key={`post-${post.id}`}
                                time={post.updatedAt}
                                title={<span className="text-primary">{post.title}</span>}
                                description={`by ${post.author.name}`}
                                link={`/movies/${post.id}`}
                            />
                        ))}
                    </GroupedActivityCard>
                 </TimelineItem>
            )}

        </Timeline>
      ) : (
        <Card className="text-center border-dashed">
            <CardContent className="p-16 flex flex-col items-center gap-4">
              <Bell className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No Activity Yet</h3>
              <p className="text-muted-foreground">
                Your recent notifications and updates will appear here.
              </p>
            </CardContent>
        </Card>
      )}
    </main>
  );
}

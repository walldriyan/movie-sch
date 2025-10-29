import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { getNotifications, getPosts } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Film, Users } from 'lucide-react';
import Link from 'next/link';
import ClientRelativeDate from '@/components/client-relative-date';

const Timeline = ({ children }: { children: React.ReactNode }) => (
  <ol className="relative border-l border-gray-700">{children}</ol>
);

const TimelineItem = ({ children }: { children: React.ReactNode }) => (
  <li className="mb-10 ml-6">{children}</li>
);

const TimelineIcon = ({ icon }: { icon: React.ReactNode }) => (
  <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-900 ring-8 ring-gray-900">
    {icon}
  </span>
);

const TimelineContent = ({ time, title, description, link }: { time: string, title: React.ReactNode, description?: string, link?: string }) => {
  const content = (
    <>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="flex items-center text-lg font-semibold text-white">
          {title}
        </h3>
      </div>
      <time className="mb-2 block text-sm font-normal leading-none text-gray-500">
        <ClientRelativeDate date={time} />
      </time>
      {description && <p className="text-base font-normal text-gray-400">{description}</p>}
    </>
  );

  if (link) {
    return (
      <Link href={link} className="block rounded-lg p-4 border border-gray-800 bg-gray-900/50 hover:bg-gray-800/60">
        {content}
      </Link>
    )
  }

  return (
    <div className="rounded-lg p-4 border border-gray-800 bg-gray-900/50">
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
          {notifications.map(notif => (
            <TimelineItem key={`notif-${notif.id}`}>
              <TimelineIcon icon={<Bell className="h-3 w-3 text-blue-300" />} />
              <TimelineContent 
                time={notif.createdAt as unknown as string}
                title={notif.title}
                description={notif.message}
              />
            </TimelineItem>
          ))}
          {recentPosts.map(post => (
            <TimelineItem key={`post-${post.id}`}>
              <TimelineIcon icon={<Film className="h-3 w-3 text-blue-300" />} />
              <TimelineContent 
                time={post.updatedAt}
                title={
                    <>
                     New Post: <span className="text-primary ml-2">{post.title}</span>
                    </>
                }
                description={`by ${post.author.name}`}
                link={`/movies/${post.id}`}
              />
            </TimelineItem>
          ))}
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

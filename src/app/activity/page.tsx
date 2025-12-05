import { Suspense } from 'react';
import { getNotifications, getPosts } from '@/lib/actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ActivityPageClient from './activity-page-client';
import { Metadata } from 'next';
import { Activity, Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Activity | CineVerse',
  description: 'View your recent activity and notifications.',
};

export const dynamic = 'force-dynamic';

// Loading skeleton
function ActivitySkeleton() {
  return (
    <main className="container mx-auto max-w-2xl py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Activity className="h-8 w-8 text-primary" />
        <h1 className="font-serif text-4xl font-bold">My Activity</h1>
      </div>
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </main>
  );
}

export default async function ActivityPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch initial data server-side for instant display
  const [notifResult, postsResult] = await Promise.all([
    getNotifications({ page: 1, limit: 5 }),
    getPosts({ page: 1, limit: 5 })
  ]);

  const initialData = {
    notifications: notifResult.items || [],
    posts: postsResult.posts || [],
    totalNotifs: notifResult.total || 0,
    totalPosts: postsResult.totalPosts || 0,
  };

  return (
    <Suspense fallback={<ActivitySkeleton />}>
      <ActivityPageClient initialData={initialData} />
    </Suspense>
  );
}

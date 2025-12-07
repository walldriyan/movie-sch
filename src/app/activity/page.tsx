import { Suspense } from 'react';
import { getNotifications } from '@/lib/actions/notifications';
import { getPosts } from '@/lib/actions/posts/read';
import { getFavoritePosts } from '@/lib/actions/posts/read'; // Assuming it's in read.ts
import { getExamsForUser } from '@/lib/actions/exams';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ActivityPageClient from './activity-page-client';
import { Metadata } from 'next';
import { Activity, Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Activity | Fiddle',
  description: 'View your recent activity, notifications, favorites and exams.',
};

export const dynamic = 'force-dynamic';

// Loading skeleton
function ActivitySkeleton() {
  return (
    <main className="container mx-auto max-w-2xl py-12 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Activity className="h-8 w-8 text-primary" />
        <h1 className="font-serif text-4xl font-bold">Activity Center</h1>
      </div>
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </main>
  );
}

export default async function ActivityPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch initial data server-side for instant display
  const [notifResult, postsResult, favoritesResult, examsResult] = await Promise.all([
    getNotifications({ page: 1, limit: 10 }),
    getPosts({ page: 1, limit: 10 }),
    getFavoritePosts(),
    getExamsForUser(session.user.id)
  ]);

  const initialData = {
    notifications: notifResult.items || [],
    posts: postsResult.posts || [],
    favorites: favoritesResult || [],
    exams: examsResult || [],
    totalNotifs: notifResult.total || 0,
    totalPosts: postsResult.totalPosts || 0,
  };

  return (
    <Suspense fallback={<ActivitySkeleton />}>
      <ActivityPageClient initialData={initialData} />
    </Suspense>
  );
}

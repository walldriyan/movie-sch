import { Suspense } from 'react';
import { getFavoritePosts } from '@/lib/actions';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import FavoritesPageClient from './favorites-page-client';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'My Favorites | StreamVault',
  description: 'Your saved movies, series, and favorite content.',
};

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const favoritePosts = await getFavoritePosts();

  return (
    <div className="min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      }>
        <FavoritesPageClient
          posts={favoritePosts as any[]}
          session={session}
        />
      </Suspense>
    </div>
  );
}

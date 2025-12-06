

import type { User as PrismaUser } from '@prisma/client';
import type { Post } from '@/lib/types';
import { getPosts, getUsers, getFavoritePostsByUserId, getSeriesByAuthorId, getExamsForUser } from '@/lib/actions';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/profile/profile-header';
import ProfilePostList from '@/components/profile/profile-post-list';
import ProfileSidebar from '@/components/profile/profile-sidebar';
import ProfileSeriesList from '@/components/profile/profile-series-list';
import ProfileExamList from '@/components/profile/profile-exam-list';
import { ROLES } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ filter?: string; 'show-all-series'?: string }>;
}) {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;

  const session = await auth();
  const loggedInUser = session?.user;

  const currentFilter = resolvedSearchParams.filter || 'posts';
  const showAllSeries = resolvedSearchParams['show-all-series'] === 'true';

  // Fetch the user whose profile is being viewed
  const allUsers = await getUsers();
  const profileUser = allUsers.find(u => u.id === username) as PrismaUser | undefined;

  if (!profileUser) {
    notFound();
  }

  const isOwnProfile = loggedInUser?.id === profileUser.id;

  let displayPosts: any[] = [];
  let displaySeries: any[] = [];
  let displayExams: any[] = [];
  let totalSeriesCount = 0;

  if (currentFilter === 'posts') {
    const { posts: allPosts } = await getPosts({
      filters: { authorId: profileUser.id, includePrivate: isOwnProfile },
    });
    displayPosts = allPosts || [];
  } else if (currentFilter === 'favorites') {
    const favoritePosts = await getFavoritePostsByUserId(profileUser.id);
    displayPosts = favoritePosts || [];
  } else if (currentFilter === 'series') {
    const { series, totalSeries } = await getSeriesByAuthorId(
      profileUser.id,
      showAllSeries ? undefined : 3
    );
    displaySeries = series || [];
    totalSeriesCount = totalSeries;
  } else if (currentFilter === 'exams') {
    if (isOwnProfile || loggedInUser?.role === ROLES.SUPER_ADMIN) {
      displayExams = await getExamsForUser(profileUser.id);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <ProfileHeader user={profileUser} currentFilter={currentFilter} isOwnProfile={isOwnProfile} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.04] p-6">
              {currentFilter === 'series' ? (
                <ProfileSeriesList
                  series={displaySeries}
                  isOwnProfile={isOwnProfile}
                  profileUser={profileUser}
                  totalSeries={totalSeriesCount}
                />
              ) : currentFilter === 'exams' ? (
                <ProfileExamList
                  exams={displayExams}
                  isOwnProfile={isOwnProfile}
                />
              ) : (
                <ProfilePostList
                  posts={displayPosts}
                  isOwnProfile={isOwnProfile}
                  currentFilter={currentFilter}
                  profileUser={profileUser}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <ProfileSidebar profileUser={profileUser} loggedInUser={loggedInUser} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

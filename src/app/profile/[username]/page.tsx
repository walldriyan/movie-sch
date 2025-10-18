

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

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ filter?: string; 'show-all-series'?: string }>;
}) {
  // 🟢 Promise resolve කරලා values ගන්නවා
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
    // Only fetch exams if it's the user's own profile
    if (isOwnProfile) {
        displayExams = await getExamsForUser(profileUser.id);
    }
  }
  
  return (
    <>
      <ProfileHeader user={profileUser} currentFilter={currentFilter} isOwnProfile={isOwnProfile}/>
      <main className='overflow-hidden'>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <div className="md:col-span-2 lg:col-span-3">
              {currentFilter === 'series' ? (
                 <ProfileSeriesList
                    series={displaySeries}
                    isOwnProfile={isOwnProfile}
                    profileUser={profileUser}
                    totalSeries={totalSeriesCount}
                    showAll={showAllSeries}
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
            <aside>
              <div className="sticky top-24">
                  <ProfileSidebar profileUser={profileUser} loggedInUser={loggedInUser} />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

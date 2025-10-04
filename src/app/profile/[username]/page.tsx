

import type { User as PrismaUser } from '@prisma/client';
import type { Post } from '@/lib/types';
import { getPosts, getUsers, getFavoritePostsByUserId } from '@/lib/actions';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/profile/profile-header';
import ProfilePostList from '@/components/profile/profile-post-list';
import ProfileSidebar from '@/components/profile/profile-sidebar';

export default async function ProfilePage({ 
  params,
  searchParams,
}: { 
  params: { username: string },
  searchParams: { filter?: string } 
}) {
  const session = await auth();
  const loggedInUser = session?.user;
  const currentFilter = searchParams.filter || 'posts';

  // Fetch the user whose profile is being viewed
  const allUsers = await getUsers();
  const profileUser = allUsers.find(u => u.id === params.username) as PrismaUser | undefined;

  if (!profileUser) {
    notFound();
  }

  const isOwnProfile = loggedInUser?.id === profileUser.id;

  let displayPosts: any[] = [];
  if (currentFilter === 'posts') {
    const { posts: allPosts } = await getPosts({ filters: { authorId: profileUser.id, includePrivate: isOwnProfile } });
    displayPosts = allPosts;
  } else if (currentFilter === 'favorites') {
    displayPosts = await getFavoritePostsByUserId(profileUser.id);
  }
  
  return (
    <>
      <ProfileHeader user={profileUser} currentFilter={currentFilter} isOwnProfile={isOwnProfile}/>
      <main className='overflow-hidden'>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <div className="md:col-span-2 lg:col-span-3">
              <ProfilePostList
                posts={displayPosts}
                isOwnProfile={isOwnProfile}
                currentFilter={currentFilter}
                profileUser={profileUser}
              />
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

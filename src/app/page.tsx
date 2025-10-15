

import { getPosts, getUsers, getPublicGroups, getNotifications } from '@/lib/actions';
import HomePageClient from '@/components/home-page-client';
import { MyReusableButton } from '@/components/my-reusable-button'; // Import a custom button
import { Mail } from 'lucide-react';
import type { Notification } from '@prisma/client';
import { auth } from '@/auth';
import MetaSpotlight from './ui/page';
import MetaSpotlight1 from './ui/newexample2';
import MetaSpotlight3 from './ui/example3';
import { Post } from '@/lib/types';

export default async function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const timeFilter = (searchParams?.timeFilter as string) || 'all';
  const sortBy = (searchParams?.sortBy as string) || 'updatedAt-desc';
  const typeFilter = searchParams?.type as string | undefined;
  const currentPage = Number(searchParams?.page) || 1;

  const session = await auth();
  console.log("Server [/page.tsx] Session from auth() on server:", JSON.stringify(session, null, 2));

  const { posts, totalPages } = await getPosts({
    page: 1,
    limit: 15, // Fetch more posts for the spotlight
    filters: { timeFilter, sortBy, type: typeFilter },
  });
  const users = await getUsers();
  const groups = await getPublicGroups(5);
  const notifications = await getNotifications();
  
  return (
    <>
      <MetaSpotlight3 posts={posts as Post[]} />
      <MetaSpotlight1 />
      <MetaSpotlight/>
      <HomePageClient
        initialPosts={posts}
        initialUsers={users}
        initialGroups={groups}
        totalPages={totalPages}
        currentPage={currentPage}
        searchParams={{ timeFilter, page: String(currentPage), sortBy, type: typeFilter }}
        initialNotifications={notifications}
        session={session}
      />
    </>
  );
}

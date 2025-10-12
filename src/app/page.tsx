

'use server';

import { getPosts, getUsers, getPublicGroups, getNotifications } from '@/lib/actions';
import HomePageClient from '@/components/home-page-client';
import { MyReusableButton } from '@/components/my-reusable-button'; // Import a custom button
import { Mail } from 'lucide-react';
import type { Notification } from '@prisma/client';

export default async function HomePage({ searchParams }: { searchParams?: { timeFilter?: string, page?: string, sortBy?: string, type?: string } }) {
  const timeFilter = searchParams?.timeFilter || 'all';
  const sortBy = searchParams?.sortBy || 'updatedAt-desc';
  const typeFilter = searchParams?.type;
  const currentPage = Number(searchParams?.page) || 1;

  const { posts, totalPages } = await getPosts({ page: currentPage, limit: 10, filters: { timeFilter, sortBy, type: typeFilter } });
  const users = await getUsers();
  const groups = await getPublicGroups(5);
  const notifications = (await getNotifications()) as Notification[];
  
  return (
    <>
      <HomePageClient
        initialPosts={posts}
        initialUsers={users}
        initialGroups={groups as any}
        totalPages={totalPages}
        currentPage={currentPage}
        searchParams={{ timeFilter, page: String(currentPage), sortBy, type: typeFilter }}
        initialNotifications={notifications}
      />
     
    </>
  );
}

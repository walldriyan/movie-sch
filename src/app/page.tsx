

import { getPosts, getUsers, getPublicGroups, getNotifications } from '@/lib/actions';
import HomePageClient from '@/components/home-page-client';
import { MyReusableButton } from '@/components/my-reusable-button'; // Import a custom button
import { Mail } from 'lucide-react';
import type { Notification } from '@prisma/client';

export default async function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const timeFilter = (searchParams?.timeFilter as string) || 'all';
  const sortBy = (searchParams?.sortBy as string) || 'updatedAt-desc';
  const typeFilter = searchParams?.type as string | undefined;
  const currentPage = Number(searchParams?.page) || 1;

  const { posts, totalPages } = await getPosts({
    page: currentPage,
    limit: 10,
    filters: { timeFilter, sortBy, type: typeFilter },
  });
  const users = await getUsers();
  const groups = await getPublicGroups(5);
  const notifications = (await getNotifications()) as Notification[];
  
  // Serialize data to plain objects
  const plainPosts = JSON.parse(JSON.stringify(posts));
  const plainUsers = JSON.parse(JSON.stringify(users));
  const plainGroups = JSON.parse(JSON.stringify(groups));
  const plainNotifications = JSON.parse(JSON.stringify(notifications));

  return (
    <>
      <HomePageClient
        initialPosts={plainPosts}
        initialUsers={plainUsers}
        initialGroups={plainGroups}
        totalPages={totalPages}
        currentPage={currentPage}
        searchParams={{ timeFilter, page: String(currentPage), sortBy, type: typeFilter }}
        initialNotifications={plainNotifications}
      />
    </>
  );
}


import { getPosts, getUsers, getPublicGroups } from '@/lib/actions';
import HomePageClient from '@/components/home-page-client';
import { MyReusableButton } from '@/components/my-reusable-button';
import { Mail } from 'lucide-react';
import type { Notification } from '@prisma/client';
import { auth } from '@/auth';
import MetaSpotlight from './ui/page';

import MetaSpotlight3 from './ui/example3';
import { Post } from '@/lib/types';
import MetaSpotlightPostGrid from './ui/postGrid';
import { Drag_Transform } from './ui/dragComponent';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>; // ✅ Promise type එක හරි
}) {
  const params = await searchParams;

  const timeFilter = (params.timeFilter as string) || 'updatedAt-desc';
  const sortBy = (params.sortBy as string) || 'updatedAt-desc';
  const typeFilter = params.type as string | undefined;
  const currentPage = Number(params.page) || 1;
  const lockStatus = params.lockStatus as string | undefined;

  const session = await auth();
  
  const postDataPromise = getPosts({
    page: currentPage,
    limit: 10,
    filters: { timeFilter, sortBy, type: typeFilter, lockStatus },
  });
  const usersPromise = getUsers({ limit: 10 }); // Fetch only 10 users for the homepage
  const groupsPromise = getPublicGroups();

  const [{ posts, totalPages }, users, groups] = await Promise.all([
    postDataPromise,
    usersPromise,
    groupsPromise
  ]);
  
  return (
    <>
      <HomePageClient
        initialPosts={posts}
        initialUsers={users}
        initialGroups={groups}
        totalPages={totalPages}
        currentPage={currentPage}
        searchParams={{ timeFilter, page: String(currentPage), sortBy, type: typeFilter, lockStatus }}
        session={session}
      />
    </>
  );
}

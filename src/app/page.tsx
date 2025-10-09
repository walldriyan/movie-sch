

'use server';

import { getPosts, getUsers } from '@/lib/actions';
import HomePageClient from '@/components/home-page-client';

export default async function HomePage({ searchParams }: { searchParams?: { timeFilter?: string, page?: string, sortBy?: string, type?: string } }) {
  const timeFilter = searchParams?.timeFilter;
  const sortBy = searchParams?.sortBy;
  const typeFilter = searchParams?.type;
  const currentPage = Number(searchParams?.page) || 1;

  const { posts, totalPages } = await getPosts({ page: currentPage, limit: 10, filters: { timeFilter, sortBy, type: typeFilter } });
  const users = await getUsers();
  
  return (
    <HomePageClient
      initialPosts={posts}
      initialUsers={users}
      totalPages={totalPages}
      currentPage={currentPage}
      searchParams={searchParams}
    />
  );
}

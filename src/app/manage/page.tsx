

import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { ROLES, MovieStatus } from '@/lib/permissions';
import ManagePostsClient from '@/app/manage/client';
import { getPostsForAdmin, getPost } from '@/lib/actions';
import type { Post } from '@prisma/client';

export default async function ManagePostsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {

  const resolvedSearchParams = await searchParams;

   const session = await auth();
  const user = session?.user;

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
  }

  const page = Number(resolvedSearchParams?.page) || 1;
  const status =
    (resolvedSearchParams?.status as string) || MovieStatus.PENDING_APPROVAL;

    
  // Fetch initial data on the server with the default filter.
  const { posts, totalPages } = await getPostsForAdmin({ 
    page: page, 
    limit: 10, 
    userId: user.id, 
    userRole: user.role,
    status: status,
  });
  
  // Pass the server-fetched data as initial props to the client component.
  // The client component will handle URL search params from now on.
  return (
    <ManagePostsClient 
      initialPosts={posts as any} 
      initialTotalPages={totalPages} 
      user={user} 
    />
  );
}

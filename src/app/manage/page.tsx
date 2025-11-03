

import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { ROLES, MovieStatus } from '@/lib/permissions';
import ManagePostsClient from '@/app/manage/client';
import { getPostsForAdmin } from '@/lib/actions';

export default async function ManagePostsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  console.log('[ManagePage] Server Component rendering. Search Params:', resolvedSearchParams);

  const session = await auth();
  const user = session?.user;

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    console.error('[ManagePage] User not authorized. Redirecting to notFound.');
    notFound();
  }

  const page = Number(resolvedSearchParams?.page) || 1;
  const status =
    (resolvedSearchParams?.status as string) || MovieStatus.PENDING_APPROVAL;

  console.log(`[ManagePage] Fetching posts for admin. Page: ${page}, Status: ${status}`);
  // Fetch initial data on the server with the default filter.
  const { posts, totalPages } = await getPostsForAdmin({ 
    page: page, 
    limit: 10, 
    userId: user.id, 
    userRole: user.role,
    status: status,
  });
  console.log(`[ManagePage] Fetched ${posts.length} posts. Total pages: ${totalPages}.`);
  
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

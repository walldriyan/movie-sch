
import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import { ROLES, MovieStatus } from '@/lib/permissions';
import ManagePostsClient from '@/app/manage/client';
import { getPostsForAdmin } from '@/lib/actions/index';

export default async function ManagePostsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  console.log('[ManagePage] Server Component rendering. Search Params:', resolvedSearchParams);

  const session = await auth();
  const user = session?.user;

  // Redirect if unauthorized
  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    console.log('[ManagePage] User not authorized. Redirecting to Home.');
    redirect('/');
  }

  // User is guaranteed to be defined here due to the redirect checks above
  const currentUser = user!;

  const page = Number(resolvedSearchParams?.page) || 1;
  const status =
    (resolvedSearchParams?.status as string) || MovieStatus.PENDING_APPROVAL;

  console.log(`[ManagePage] Fetching posts for admin. Page: ${page}, Status: ${status}`);

  // Fetch initial data on the server with the default filter, using confirmed currentUser properties
  const { posts, totalPages } = await getPostsForAdmin({
    page: page,
    limit: 10,
    userId: currentUser.id,
    userRole: currentUser.role,
    status: status,
  });
  console.log(`[ManagePage] Fetched ${posts.length} posts. Total pages: ${totalPages}.`);

  return (
    <ManagePostsClient
      initialPosts={posts as any}
      initialTotalPages={totalPages}
      user={currentUser}
    />
  );
}

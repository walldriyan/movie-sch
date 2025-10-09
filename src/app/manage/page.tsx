

'use server';

import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import ManagePostsClient from '@/app/manage/client';
import { getPostsForAdmin, getPost } from '@/lib/actions';
import type { Post } from '@prisma/client';
import Loading from './loading';

export default async function ManagePostsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
  }

  // Fetch initial data on the server.
  const { posts, totalPages } = await getPostsForAdmin({ 
    page: 1, 
    limit: 10, 
    userId: user.id, 
    userRole: user.role 
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

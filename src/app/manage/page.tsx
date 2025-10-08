

'use server';

import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import ManagePostsClient from '@/app/manage/client';
import { getPostsForAdmin, getPost } from '@/lib/actions/postActions';
import type { Post } from '@prisma/client';
import Loading from './loading';

export default async function ManagePostsPage({ searchParams }: { searchParams?: { edit?: string, create?: string } }) {
  const session = await auth();
  const user = session?.user;

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
  }

  // Check if we are in edit mode
  const editingPostId = searchParams?.edit ? parseInt(searchParams.edit, 10) : undefined;
  let editingPost = null;

  if (editingPostId && !isNaN(editingPostId)) {
    const postToEdit = await getPost(editingPostId);
    // Basic authorization check: does the user own this post or are they a super admin?
    if (postToEdit && (postToEdit.authorId === user.id || user.role === ROLES.SUPER_ADMIN)) {
      editingPost = postToEdit;
    } else {
       // You might want to handle this case, e.g., show an error or redirect
       console.warn(`User ${user.id} tried to edit post ${editingPostId} without permission.`);
    }
  }
  
  const startInCreateMode = searchParams?.create === 'true' && !editingPostId;

  // Fetch initial data on the server.
  const { posts, totalPages } = await getPostsForAdmin({ 
    page: 1, 
    limit: 10, 
    userId: user.id, 
    userRole: user.role 
  });
  
  // Pass the server-fetched data as initial props to the client component.
  return (
    <ManagePostsClient 
      initialPosts={posts as any} 
      initialTotalPages={totalPages} 
      user={user} 
      initialEditingPost={editingPost as any}
      startInCreateMode={startInCreateMode}
    />
  );
}

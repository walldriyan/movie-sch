

'use client';

import React, { useEffect, useState, useTransition } from 'react';
import type { Post } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { savePost, deletePost, getPostsForAdmin, getPost, updatePostStatus } from '@/lib/actions/index';
import type { PostFormData } from '@/lib/types';
import { PERMISSIONS, ROLES, MovieStatus } from '@/lib/permissions';
import PostList from '@/components/manage/post-list';
import PostForm from '@/components/manage/post-form';
import type { Session } from 'next-auth';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';


interface ManagePostsClientProps {
  initialPosts: Post[];
  initialTotalPages: number;
  user: Session['user'];
}

export default function ManagePostsClient({
  initialPosts,
  initialTotalPages,
  user,
}: ManagePostsClientProps) {
  console.log('[ManageClient] Component rendering.');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const [isSubmitting, startSubmit] = useTransition();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const currentPage = Number(searchParams.get('page')) || 1;
  const statusFilter = searchParams.get('status') || MovieStatus.PENDING_APPROVAL;
  const totalPages = initialTotalPages;


  useEffect(() => {
    console.log('[ManageClient] useEffect for routing triggered. searchParams:', searchParams.toString());
    const editId = searchParams.get('edit');
    const create = searchParams.get('create');

    const fetchPostToEdit = async (id: string) => {
      console.log(`[ManageClient] Fetching post to edit with ID: ${id}`);
      const postToEdit = await getPost(Number(id));
      if (postToEdit && (postToEdit.authorId === user.id || user.role === ROLES.SUPER_ADMIN)) {
        setEditingPost(postToEdit as any);
        setView('form');
        console.log('[ManageClient] Set view to "form" for editing.');
      } else {
        console.warn(`[ManageClient] User ${user.id} tried to edit post ${id} without permission.`);
        router.push('/manage'); // Redirect if no permission
      }
    };

    if (editId) {
      fetchPostToEdit(editId);
    } else if (create === 'true') {
      setEditingPost(null);
      setView('form');
      console.log('[ManageClient] Set view to "form" for creation.');
    } else {
      setView('list');
      setEditingPost(null);
      console.log('[ManageClient] Set view to "list".');
    }
  }, [searchParams, user.id, user.role, router]);

  const handlePageChange = (page: number) => {
    console.log(`[ManageClient] handlePageChange called with page: ${page}`);
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleFilterChange = (status: string | null) => {
    console.log(`[ManageClient] handleFilterChange called with status: ${status}`);
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleRefresh = () => {
    console.log('[ManageClient] handleRefresh called.');
    startRefresh(() => {
      router.refresh();
      toast({
        title: 'Post list refreshed',
      });
    });
  }

  const handleAddNewPost = () => {
    console.log('[ManageClient] handleAddNewPost called.');
    router.push('/manage?create=true');
  };

  const handleEditPost = (post: Post) => {
    console.log(`[ManageClient] handleEditPost called for post ID: ${post.id}`);
    router.push(`/manage?edit=${post.id}`);
  };

  const handleBackFromForm = () => {
    console.log('[ManageClient] handleBackFromForm called.');
    router.push('/manage');
  };

  const handleFormSubmit = (
    postData: PostFormData,
    id: number | undefined
  ) => {
    console.log('[ManageClient] handleFormSubmit called. Submitting post...');
    startSubmit(async () => {
      try {
        await savePost(postData, id);
        toast({
          title: 'Success',
          description: `Post "${postData.title}" has been submitted for approval.`,
        });
        console.log('[ManageClient] Post submission successful, navigating back.');
        handleBackFromForm(); // Redirect back to the manage page
      } catch (error: any) {
        console.error("[ManageClient] Post submission failed:", error);
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: error.message || "An unexpected error occurred."
        });
      } finally {
        console.log('[ManageClient] Post submission action finished.');
      }
    });
  };

  const handleDeleteConfirmed = (postId: number) => {
    console.log(`[ManageClient] handleDeleteConfirmed called for post ID: ${postId}`);
    startRefresh(async () => {
      const postToDelete = posts.find(m => m.id === postId);
      if (postToDelete) {
        await deletePost(postId);
        toast({
          title: 'Success',
          description: `Post "${postToDelete.title}" action has been processed.`,
        });
        router.refresh();
      }
    });
  };


  const handleStatusChange = (postId: number, newStatus: string) => {
    console.log(`[ManageClient] handleStatusChange called for post ID: ${postId}, new status: ${newStatus}`);
    startRefresh(async () => {
      try {
        await updatePostStatus(postId, newStatus);
        toast({
          title: 'Status Updated',
          description: `Post status has been changed to ${newStatus}.`,
        });
        router.refresh();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to update post status.',
        });
      }
    });
  };

  const visiblePosts = user?.permissions?.includes(
    PERMISSIONS['post.approve_deletion']
  )
    ? initialPosts
    : initialPosts.filter((m) => m.status !== 'PENDING_DELETION');

  console.log(`[ManageClient] Rendering view: ${view}`);
  return (
    <>
      {view === 'list' ? (
        <>
          <PostList
            posts={visiblePosts as any}
            onAddNew={handleAddNewPost}
            onEdit={handleEditPost}
            onDeleteConfirmed={handleDeleteConfirmed}
            onStatusChange={handleStatusChange}
            onRefresh={handleRefresh}
            onFilterChange={handleFilterChange}
            isRefreshing={isRefreshing}
            statusChangingPostId={null} // Simplified, refresh handles this
            currentFilter={statusFilter}
          />
          {totalPages > 1 && !isRefreshing && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <PaginationPrevious href="#" />
                  </Button>
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i + 1}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <Button
                    variant="ghost"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <PaginationNext href="#" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <PostForm
          editingPost={editingPost as any}
          onFormSubmit={handleFormSubmit}
          onBack={handleBackFromForm}
          isSubmitting={isSubmitting}
          debugError={undefined}
        />
      )}
    </>
  );
}

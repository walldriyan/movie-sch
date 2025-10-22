
'use client';

import React, { useEffect, useState, useTransition } from 'react';
import type { Post } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { savePost, deletePost, getPostsForAdmin, getPost, updatePostStatus } from '@/lib/actions';
import type { PostFormData } from '@/lib/types';
import { PERMISSIONS, ROLES, MovieStatus } from '@/lib/permissions';
import ManageLayout from '@/components/manage/manage-layout';
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
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusChangingPostId, setStatusChangingPostId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(MovieStatus.PENDING_APPROVAL);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  useEffect(() => {
    // Only run this effect if we are on the manage page
    if (pathname !== '/manage') {
      return;
    }

    const editId = searchParams.get('edit');
    const create = searchParams.get('create');

    if (editId) {
      const fetchPostToEdit = async () => {
        const postToEdit = await getPost(Number(editId));
        if (postToEdit && (postToEdit.authorId === user.id || user.role === ROLES.SUPER_ADMIN)) {
          setEditingPost(postToEdit as any);
          setView('form');
        } else {
          console.warn(`User ${user.id} tried to edit post ${editId} without permission.`);
          setView('list');
        }
      };
      fetchPostToEdit();
    } else if (create === 'true') {
      setEditingPost(null);
      setView('form');
    } else {
      setView('list');
    }
  }, [searchParams, user.id, user.role, pathname]);


  const fetchPosts = async (page: number, status: string | null) => {
    setIsRefreshing(true);
    startTransition(async () => {
      try {
        const { posts: postsFromDb, totalPages: newTotalPages } = await getPostsForAdmin({ 
          page, 
          limit: 10, 
          userId: user.id, 
          userRole: user.role,
          status,
        });
        setPosts(postsFromDb as any);
        setTotalPages(newTotalPages);
        setCurrentPage(page);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch posts.',
        });
        console.error("--- [ManagePostsClient] fetchPosts: Error ---", error);
      } finally {
        setIsRefreshing(false);
      }
    });
  };
  
  useEffect(() => {
    if (view === 'list') {
      fetchPosts(currentPage, statusFilter);
    }
  }, [currentPage, statusFilter, view]);

  const handleAddNewPost = () => {
    setEditingPost(null);
    const url = new URL(window.location.href);
    url.searchParams.set('create', 'true');
    url.searchParams.delete('edit');
    window.history.pushState({}, '', url.toString());
    setView('form');
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    const url = new URL(window.location.href);
    url.searchParams.set('edit', String(post.id));
    url.searchParams.delete('create');
    window.history.pushState({}, '', url.toString());
    setView('form');
  };

  const handleFormSubmit = async (
    postData: PostFormData,
    id: number | undefined
  ) => {
    startTransition(async () => {
      console.log("Submitting post...");
      try {
        await savePost(postData, id);
        await fetchPosts(id ? currentPage : 1, statusFilter);
        handleBackFromForm(); // Go back to list and clear URL params
        toast({
          title: 'Success',
          description: `Post "${postData.title}" has been submitted for approval.`,
        });
      } catch (error: any) {
        console.error("Post submission failed:", error);
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: error.message || "An unexpected error occurred."
        });
      } finally {
        console.log("Post submission action finished.");
      }
    });
  };

  const handleDeleteConfirmed = async (postId: number) => {
    const postToDelete = posts.find(m => m.id === postId);
    if (postToDelete) {
      await deletePost(postId);
      await fetchPosts(currentPage, statusFilter);
      toast({
        title: 'Success',
        description: `Post "${postToDelete.title}" action has been processed.`,
      });
    }
  };


  const handleStatusChange = async (postId: number, newStatus: string) => {
    setStatusChangingPostId(postId);
    try {
      await updatePostStatus(postId, newStatus);
      await fetchPosts(currentPage, statusFilter);
      toast({
        title: 'Status Updated',
        description: `Post status has been changed to ${newStatus}.`,
      });
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update post status.',
      });
      console.error("--- [ManagePostsClient] handleStatusChange: Error ---", error);
    } finally {
      setStatusChangingPostId(null);
    }
  };
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleBackFromForm = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    url.searchParams.delete('create');
    window.history.pushState({}, '', url.toString());
    setView('list');
  };
  
  const handleRefresh = () => {
    fetchPosts(currentPage, statusFilter);
    toast({
      title: 'Post list refreshed',
    });
  }

  const handleFilterChange = (status: string | null) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page on filter change
  }

  const visiblePosts = user?.permissions?.includes(
    PERMISSIONS['post.approve_deletion']
  )
    ? posts
    : posts.filter((m) => m.status !== 'PENDING_DELETION');

  return (
    <>
      <ManageLayout>
        {view === 'list' ? (
          <>
            <PostList
              posts={visiblePosts}
              onAddNew={handleAddNewPost}
              onEdit={handleEditPost}
              onDeleteConfirmed={handleDeleteConfirmed}
              onStatusChange={handleStatusChange}
              onRefresh={handleRefresh}
              onFilterChange={handleFilterChange}
              isRefreshing={isRefreshing}
              statusChangingPostId={statusChangingPostId}
              currentFilter={statusFilter}
            />
            {totalPages > 1 && !isRefreshing && (
               <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                     {Array.from({ length: totalPages }, (_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            href="#"
                            isActive={currentPage === i + 1}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(i + 1);
                            }}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                     ))}

                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
            )}
          </>
        ) : (
          <PostForm
            editingPost={editingPost}
            onFormSubmit={handleFormSubmit}
            onBack={handleBackFromForm}
            isSubmitting={isPending}
            debugError={undefined}
          />
        )}
      </ManageLayout>
    </>
  );
}

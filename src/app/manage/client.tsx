

'use client';

import React, { useEffect, useState, useTransition } from 'react';
import type { Post } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { savePost, deletePost, getPostsForAdmin, updatePostStatus } from '@/lib/actions';
import type { PostFormData } from '@/lib/types';
import { PERMISSIONS, ROLES } from '@/lib/permissions';
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


interface ManagePostsClientProps {
  initialPosts: Post[];
  initialTotalPages: number;
  user: Session['user'];
  initialEditingPost?: Post | null;
  startInCreateMode?: boolean;
}

export default function ManagePostsClient({ 
  initialPosts, 
  initialTotalPages, 
  user, 
  initialEditingPost, 
  startInCreateMode = false 
}: ManagePostsClientProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [view, setView] = useState<'list' | 'form'>(initialEditingPost || startInCreateMode ? 'form' : 'list');
  const [editingPost, setEditingPost] = useState<Post | null>(initialEditingPost || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [formError, setFormError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusChangingPostId, setStatusChangingPostId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [debugError, setDebugError] = useState<any>(null);


  const { toast } = useToast();

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
    setFormError(null);
    setView('form');
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setFormError(null);
    setView('form');
  };

  const handleFormSubmit = async (
    postData: PostFormData,
    id: number | undefined
  ) => {
    try {
      setFormError(null);
      await savePost(postData, id);
      await fetchPosts(id ? currentPage : 1, statusFilter);
      setView('list');
      toast({
        title: 'Success',
        description: `Post "${postData.title}" has been submitted for approval.`,
      });
    } catch (error: any) {
      console.error('Failed to save post:', error);
      setFormError(error.message || 'An unknown error occurred while saving the post.');
    }
  };

  const handleDeleteConfirmed = async (postId: number) => {
    setDebugError(null);
    try {
      const postToDelete = posts.find(m => m.id === postId);
      if (postToDelete) {
        await deletePost(postId);
        await fetchPosts(currentPage, statusFilter);
        toast({
          title: 'Success',
          description: `Post "${postToDelete.title}" action has been processed.`,
        });
      }
    } catch (error: any) {
      console.error("Delete error caught in client:", error);
      setDebugError(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete post.',
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
    setView('list');
    setFormError(null);
    // Clear edit and create params from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('edit');
    url.searchParams.delete('create');
    window.history.pushState({}, '', url.toString());
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
      <ManageLayout user={user}>
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
            error={formError}
          />
        )}
      </ManageLayout>
      {debugError && (
        <div className="mt-8 p-4 border border-dashed rounded-lg text-left bg-card">
            <h2 className="text-lg font-semibold mb-2 text-destructive">Debug Error Information</h2>
            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
              {JSON.stringify({
                  message: debugError.message,
                  stack: debugError.stack,
                  ...debugError
              }, null, 2)}
            </pre>
          </div>
      )}
    </>
  );
}

'use client';

import React, { useEffect, useState, useTransition } from 'react';
import type { Movie } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { saveMovie, deleteMovie, getMoviesForAdmin, updateMovieStatus } from '@/lib/actions';
import type { MovieFormData } from '@/lib/types';
import { PERMISSIONS, ROLES } from '@/lib/permissions';
import ManageLayout from '@/components/manage/manage-layout';
import MovieList from '@/components/manage/movie-list';
import MovieForm from '@/components/manage/movie-form';
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


interface ManageMoviesClientProps {
  initialMovies: Movie[];
  initialTotalPages: number;
  user: Session['user'];
  initialEditingMovie?: Movie | null;
}

export default function ManageMoviesClient({ initialMovies, initialTotalPages, user, initialEditingMovie }: ManageMoviesClientProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [view, setView] = useState<'list' | 'form'>(initialEditingMovie ? 'form' : 'list');
  const [editingMovie, setEditingMovie] = useState<Movie | null>(initialEditingMovie || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [formError, setFormError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusChangingMovieId, setStatusChangingMovieId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();

  const fetchMovies = async (page: number, status: string | null) => {
    setIsRefreshing(true);
    startTransition(async () => {
      try {
        const { movies: moviesFromDb, totalPages: newTotalPages } = await getMoviesForAdmin({ 
          page, 
          limit: 10, 
          userId: user.id, 
          userRole: user.role,
          status,
        });
        setMovies(moviesFromDb as any);
        setTotalPages(newTotalPages);
        setCurrentPage(page);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to fetch movies.',
        });
      } finally {
        setIsRefreshing(false);
      }
    });
  };
  
  useEffect(() => {
    if (view === 'list') {
      fetchMovies(currentPage, statusFilter);
    }
  }, [currentPage, statusFilter, view]);

  const handleAddNewMovie = () => {
    setEditingMovie(null);
    setFormError(null);
    setView('form');
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    setFormError(null);
    setView('form');
  };

  const handleFormSubmit = async (
    movieData: MovieFormData,
    id: number | undefined
  ) => {
    try {
      setFormError(null);
      await saveMovie(movieData, id);
      await fetchMovies(id ? currentPage : 1, statusFilter);
      setView('list');
      toast({
        title: 'Success',
        description: `Movie "${movieData.title}" has been submitted for approval.`,
      });
    } catch (error: any) {
      console.error('Failed to save movie:', error);
      setFormError(error.message || 'An unknown error occurred while saving the movie.');
    }
  };

  const handleDeleteConfirmed = async (movieId: number) => {
    try {
      const movieToDelete = movies.find(m => m.id === movieId);
      if (movieToDelete && user?.permissions) {
        const isPermanent = user.permissions.includes(
          PERMISSIONS['post.hard_delete']
        );
        await deleteMovie(movieId, isPermanent);
        await fetchMovies(currentPage, statusFilter);
        toast({
          title: 'Success',
          description: `Movie "${movieToDelete.title}" has been ${
            isPermanent ? 'permanently deleted' : 'marked for deletion'
          }.`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete movie.',
      });
    }
  };

  const handleStatusChange = async (movieId: number, newStatus: string) => {
    setStatusChangingMovieId(movieId);
    try {
      await updateMovieStatus(movieId, newStatus);
      await fetchMovies(currentPage, statusFilter);
      toast({
        title: 'Status Updated',
        description: `Movie status has been changed to ${newStatus}.`,
      });
    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update movie status.',
      });
    } finally {
      setStatusChangingMovieId(null);
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
    // Clear edit param from URL
    window.history.pushState({}, '', '/manage');
  };
  
  const handleRefresh = () => {
    fetchMovies(currentPage, statusFilter);
    toast({
      title: 'Movie list refreshed',
    });
  }

  const handleFilterChange = (status: string | null) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page on filter change
  }

  const visibleMovies = user?.permissions?.includes(
    PERMISSIONS['post.approve_deletion']
  )
    ? movies
    : movies.filter((m) => m.status !== 'PENDING_DELETION');

  return (
    <ManageLayout user={user}>
      {view === 'list' ? (
        <>
          <MovieList
            movies={visibleMovies}
            onAddNew={handleAddNewMovie}
            onEdit={handleEditMovie}
            onDeleteConfirmed={handleDeleteConfirmed}
            onStatusChange={handleStatusChange}
            onRefresh={handleRefresh}
            onFilterChange={handleFilterChange}
            isRefreshing={isRefreshing}
            statusChangingMovieId={statusChangingMovieId}
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
        <MovieForm
          editingMovie={editingMovie}
          onFormSubmit={handleFormSubmit}
          onBack={handleBackFromForm}
          error={formError}
        />
      )}
    </ManageLayout>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import type { Movie } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { getMovies, saveMovie, deleteMovie } from '@/lib/actions';
import type { MovieFormData } from '@/lib/types';
import { PERMISSIONS } from '@/lib/permissions';
import ManageLayout from '@/components/manage/manage-layout';
import MovieList from '@/components/manage/movie-list';
import MovieForm from '@/components/manage/movie-form';
import type { Session } from 'next-auth';
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
}

export default function ManageMoviesClient({ initialMovies, initialTotalPages, user }: ManageMoviesClientProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const { toast } = useToast();

  const fetchMovies = async (page: number) => {
    try {
      const { movies: moviesFromDb, totalPages: newTotalPages } = await getMovies({ page, limit: 10 });
      setMovies(moviesFromDb as any);
      setTotalPages(newTotalPages);
      setCurrentPage(page);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch movies.',
      });
    }
  };
  
  useEffect(() => {
    fetchMovies(currentPage);
  }, [currentPage]);

  const handleAddNewMovie = () => {
    setEditingMovie(null);
    setView('form');
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    setView('form');
  };

  const handleFormSubmit = async (
    movieData: MovieFormData,
    id: number | undefined
  ) => {
    try {
      await saveMovie(movieData, id);
      await fetchMovies(id ? currentPage : 1); // Refresh current page or go to first page on new item
      setView('list');
      toast({
        title: 'Success',
        description: `Movie "${movieData.title}" has been saved.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save movie.',
      });
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
        await fetchMovies(currentPage);
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
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
          />
          {totalPages > 1 && (
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
          onBack={() => setView('list')}
        />
      )}
    </ManageLayout>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { Movie } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { getMovies, saveMovie, deleteMovie } from '@/lib/actions';
import type { MovieFormData } from '@/lib/types';
import { ROLES, PERMISSIONS } from '@/lib/permissions';
import { notFound } from 'next/navigation';
import Loading from '../loading';
import ManageLayout from '@/components/manage/manage-layout';
import MovieList from '@/components/manage/movie-list';
import MovieForm from '@/components/manage/movie-form';

export default function ManageMoviesPage() {
  const { data: session, status } = useSession();
  const user = session?.user;

  const [movies, setMovies] = useState<Movie[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const { toast } = useToast();

  const fetchMovies = async () => {
    try {
      const moviesFromDb = await getMovies();
      setMovies(moviesFromDb as any);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch movies.',
      });
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMovies();
    }
  }, [status]);

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'unauthenticated' || !user || user.role !== ROLES.SUPER_ADMIN) {
    notFound();
  }

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
      await fetchMovies();
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
        await fetchMovies();
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


  const visibleMovies = user?.permissions?.includes(
    PERMISSIONS['post.approve_deletion']
  )
    ? movies
    : movies.filter((m) => m.status !== 'PENDING_DELETION');

  return (
    <ManageLayout user={user}>
      {view === 'list' ? (
        <MovieList
          movies={visibleMovies}
          onAddNew={handleAddNewMovie}
          onEdit={handleEditMovie}
          onDeleteConfirmed={handleDeleteConfirmed}
        />
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

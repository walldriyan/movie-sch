'use client';

import React, { useState, useTransition } from 'react';
import type { Movie, User } from '@prisma/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type MovieWithDetails = Movie & { author: User, _count: { likedBy: number }};

interface MovieListClientProps {
  movies: MovieWithDetails[];
  onFilterChange: (status: string | null) => void;
  onRefresh: () => void;
  onDeleteConfirmed: (movieId: number) => void;
  onStatusChange: (movieId: number, newStatus: string) => void;
  currentFilter: string | null;
  onAddNewMovie: () => void;
  onEditMovie: (movie: MovieWithDetails) => void;
  children: React.ReactNode;
}

export default function MovieListClient({
  movies,
  onFilterChange,
  onRefresh,
  onDeleteConfirmed,
  onStatusChange,
  currentFilter,
  onAddNewMovie,
  onEditMovie,
  children
}: MovieListClientProps) {
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<MovieWithDetails | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAction = (action: () => void) => {
    startTransition(() => {
      action();
    });
  }

  const handleDeleteClick = (movie: MovieWithDetails) => {
    setMovieToDelete(movie);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (movieToDelete) {
        handleAction(() => onDeleteConfirmed(movieToDelete.id))
    }
    setDeleteAlertOpen(false);
    setMovieToDelete(null);
  };
  
  const handleStatusChangeWithTransition = (movieId: number, newStatus: string) => {
    handleAction(() => onStatusChange(movieId, newStatus));
  };

  return (
    <>
      {React.cloneElement(children as React.ReactElement, {
         onDeleteConfirmed: handleDeleteClick,
         onStatusChange: handleStatusChangeWithTransition,
         onFilterChange: (status: string | null) => handleAction(() => onFilterChange(status)),
         onRefresh: () => handleAction(onRefresh),
      })}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will affect the movie &quot;
              {movieToDelete?.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

'use server';

import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import ManageMoviesClient from '@/app/manage/client';
import { getMoviesForAdmin, getMovie } from '@/lib/actions';
import type { Movie } from '@prisma/client';
import Loading from './loading';

export default async function ManageMoviesPage({ searchParams }: { searchParams?: { edit?: string } }) {
  const session = await auth();
  const user = session?.user;

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
  }

  // Check if we are in edit mode
  const editingMovieId = searchParams?.edit ? parseInt(searchParams.edit, 10) : undefined;
  let editingMovie = null;

  if (editingMovieId && !isNaN(editingMovieId)) {
    const movieToEdit = await getMovie(editingMovieId);
    // Basic authorization check: does the user own this movie or are they a super admin?
    if (movieToEdit && (movieToEdit.authorId === user.id || user.role === ROLES.SUPER_ADMIN)) {
      editingMovie = movieToEdit;
    } else {
       // You might want to handle this case, e.g., show an error or redirect
       console.warn(`User ${user.id} tried to edit movie ${editingMovieId} without permission.`);
    }
  }

  // Fetch initial data on the server.
  const { movies, totalPages } = await getMoviesForAdmin({ 
    page: 1, 
    limit: 10, 
    userId: user.id, 
    userRole: user.role 
  });
  
  // Pass the server-fetched data as initial props to the client component.
  return (
    <ManageMoviesClient 
      initialMovies={movies as any} 
      initialTotalPages={totalPages} 
      user={user} 
      initialEditingMovie={editingMovie as any}
    />
  );
}

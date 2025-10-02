'use server';

import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import ManageMoviesClient from '@/app/manage/client';
import { getMoviesForAdmin } from '@/lib/actions';
import type { Movie } from '@prisma/client';
import Loading from './loading';

export default async function ManageMoviesPage() {
  const session = await auth();
  const user = session?.user;

  // If there's no user or the user doesn't have the required role, show 404.
  // This check now runs on the server.
  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
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
    />
  );
}

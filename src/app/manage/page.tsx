'use client';

import { useSession } from 'next-auth/react';
import { notFound } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import ManageMoviesClient from '@/app/manage/client';
import { getMoviesForAdmin } from '@/lib/actions';
import { useEffect, useState } from 'react';
import type { Movie } from '@prisma/client';
import Loading from './loading';

export default function ManageMoviesPage() {
  const { data: session, status } = useSession();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const user = session?.user;

  useEffect(() => {
    // Only run the effect if the session is authenticated and we have a user
    if (status === 'authenticated' && user) {
      if (![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
        // If the user is authenticated but doesn't have the role, then it's a true 404
        notFound();
        return;
      }
      
      setIsDataLoading(true);
      getMoviesForAdmin({ page: 1, limit: 10, userId: user.id, userRole: user.role })
        .then(({ movies, totalPages }) => {
          setMovies(movies as any);
          setTotalPages(totalPages);
        })
        .finally(() => {
          setIsDataLoading(false);
        });
    }
  }, [session, status, user]); // Depend on user object as well

  // Show loading state while session is loading or while data is being fetched
  if (status === 'loading' || (status === 'authenticated' && isDataLoading)) {
    return <Loading />;
  }

  // If session is unauthenticated after loading, show not found
  if (status === 'unauthenticated') {
    return notFound();
  }
  
  // This should only be reached for authenticated users with correct roles
  if (user) {
    return <ManageMoviesClient initialMovies={movies} initialTotalPages={totalPages} user={user} />;
  }

  // Fallback, though theoretically unreachable if logic is sound.
  return notFound();
}

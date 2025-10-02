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
  const [isLoading, setIsLoading] = useState(true);

  const user = session?.user;

  useEffect(() => {
    if (status === 'authenticated' && user) {
      if (![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
        notFound();
        return;
      }
      setIsLoading(true);
      getMoviesForAdmin({ page: 1, limit: 10, userId: user.id, userRole: user.role })
        .then(({ movies, totalPages }) => {
          setMovies(movies as any);
          setTotalPages(totalPages);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status === 'unauthenticated') {
      notFound();
    }
  }, [session, status, user]);

  if (status === 'loading' || isLoading) {
    return <Loading />;
  }

  if (!user) {
    return notFound();
  }

  return <ManageMoviesClient initialMovies={movies} initialTotalPages={totalPages} user={user} />;
}

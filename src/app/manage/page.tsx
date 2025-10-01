import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { getMovies } from '@/lib/actions';
import { ROLES } from '@/lib/permissions';
import ManageMoviesClient from '@/app/manage/client';

export default async function ManageMoviesPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
  }

  const { movies, totalPages } = await getMovies({ page: 1, limit: 10 });

  return <ManageMoviesClient initialMovies={movies as any} initialTotalPages={totalPages} user={user} />;
}

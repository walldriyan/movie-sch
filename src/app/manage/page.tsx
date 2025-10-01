import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import ManageMoviesClient from '@/app/manage/client';
import { getMoviesForAdmin } from '@/lib/actions';

export default async function ManageMoviesPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
  }

  const { movies, totalPages } = await getMoviesForAdmin({ page: 1, limit: 10, userId: user.id, userRole: user.role });

  return <ManageMoviesClient initialMovies={movies as any} initialTotalPages={totalPages} user={user} />;
}

import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { getMovies } from '@/lib/actions';
import { ROLES } from '@/lib/permissions';
import ManageMoviesClient from '@/app/manage/client';

export default async function ManageMoviesPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    notFound();
  }

  const initialMovies = await getMovies();

  return <ManageMoviesClient initialMovies={initialMovies as any} user={user} />;
}

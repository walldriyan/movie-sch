import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { getMovies } from '@/lib/actions';
import { ROLES } from '@/lib/permissions';
import ManageMoviesClient from '@/app/manage/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function getMoviesForAdmin(options: { page?: number; limit?: number, userId?: string, userRole?: string } = {}) {
    const { page = 1, limit = 10, userId, userRole } = options;
    
    if (!userId || !userRole) {
        return { movies: [], totalPages: 0, totalMovies: 0 };
    }

    const skip = (page - 1) * limit;

    let whereClause: Prisma.MovieWhereInput = {};

    if (userRole === ROLES.USER_ADMIN) {
        whereClause = { authorId: userId };
    } else if (userRole !== ROLES.SUPER_ADMIN) {
      // For any other role, they shouldn't access this page. But as a safeguard:
      return { movies: [], totalPages: 0, totalMovies: 0 };
    }
    // SUPER_ADMIN has an empty whereClause, fetching all movies.

    const movies = await prisma.movie.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            author: true,
        },
    });

    const totalMovies = await prisma.movie.count({ where: whereClause });
    const totalPages = Math.ceil(totalMovies / limit);

    return {
        movies: movies.map((movie) => ({
            ...movie,
            genres: JSON.parse(movie.genres || '[]'),
        })),
        totalPages,
        totalMovies,
    };
}


export default async function ManageMoviesPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
  }

  const { movies, totalPages } = await getMoviesForAdmin({ page: 1, limit: 10, userId: user.id, userRole: user.role });

  return <ManageMoviesClient initialMovies={movies as any} initialTotalPages={totalPages} user={user} />;
}

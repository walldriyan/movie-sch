import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import ActivityHubClient from '@/components/activity/activity-hub-client';

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect('/auth');
    }

    const userId = session.user.id;

    // Fetch all data in parallel to save execution time and resources
    const [
        userData,
        notifications,
        userPosts,
        favorites,
        examResults
    ] = await Promise.all([
        // 1. User Details (if needed beyond session)
        prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true, image: true, role: true }
        }),

        // 2. Notifications
        prisma.notification.findMany({
            where: {
                users: {
                    some: { userId: userId }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        }),

        // 3. User Posts
        prisma.post.findMany({
            where: { authorId: userId },
            include: {
                _count: { select: { favoritePosts: true } }
            },
            orderBy: { createdAt: 'desc' }
        }),

        // 4. Favorites (with Post details)
        prisma.favoritePost.findMany({
            where: { userId },
            include: {
                post: {
                    select: {
                        id: true,
                        title: true,
                        posterUrl: true,
                        type: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),

        // 5. Exam Results
        prisma.examSubmission.findMany({
            where: { userId },
            include: {
                exam: {
                    select: {
                        title: true,
                        _count: { select: { questions: true } }
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        })
    ]);

    // Calculate aggregated stats
    const stats = {
        totalPosts: userPosts.length,
        totalFavorites: favorites.length,
        examsTaken: examResults.length,
        averageScore: examResults.length > 0
            ? examResults.reduce((acc, curr) => acc + curr.score, 0) / examResults.length
            : 0
    };

    return (
        <ActivityHubClient
            user={{ ...session.user, ...userData }}
            notifications={notifications}
            posts={userPosts}
            favorites={favorites}
            examResults={examResults}
            stats={stats}
        />
    );
}

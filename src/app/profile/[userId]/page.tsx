import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import ProfileHeader from '@/components/profile/profile-header';
import ProfilePostList from '@/components/profile/profile-post-list';
import ProfileAdsList from '@/components/profile/profile-ads-list';
// Assuming these exist based on listing
// import ProfileSeriesList from '@/components/profile/profile-series-list';
// import ProfileExamList from '@/components/profile/profile-exam-list';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
    params,
    searchParams
}: {
    params: { userId: string },
    searchParams: { filter?: string }
}) {
    const session = await auth();
    const { userId } = params;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            _count: {
                select: { posts: true, followers: true, following: true, favorites: true }
            }
        }
    });

    if (!user) {
        notFound();
    }

    const isOwnProfile = session?.user?.id === user.id;
    const filter = searchParams.filter || 'posts';

    let content;

    // Logic to select content
    if (filter === 'ads' && isOwnProfile) {
        const ads = await prisma.sponsoredPost.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: { payment: true }
        });
        content = <ProfileAdsList ads={ads} isOwnProfile={isOwnProfile} />;
    }
    // Simplified: Only implementing Posts and Ads for now to ensure this works. 
    // Expand for Series/Exams if needed or if components are verified compatible.
    else {
        // Fetch posts
        const posts = await prisma.post.findMany({
            where: { authorId: user.id, published: true },
            include: {
                author: true,
                series: true,
                _count: { select: { reviews: true, likes: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        content = <ProfilePostList posts={posts} />;
    }

    const stats = {
        postsCount: user._count.posts,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        favoritesCount: user._count.favorites
    };

    return (
        <main className="min-h-screen pb-20 bg-background">
            <ProfileHeader
                user={user}
                currentFilter={filter}
                isOwnProfile={isOwnProfile}
                stats={stats}
            />

            <div className="px-4 md:px-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
                {content}
            </div>
        </main>
    );
}

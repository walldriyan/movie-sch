import { Suspense } from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import ProfileHeader from '@/components/profile/profile-header';
import ProfilePostList from '@/components/profile/profile-post-list';
import ProfileAdsList from '@/components/profile/profile-ads-list';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
    params,
    searchParams
}: {
    params: Promise<{ userId: string }>,
    searchParams: Promise<{ filter?: string }>
}) {
    const session = await auth();
    const { userId } = await params;
    const { filter: filterParam } = await searchParams;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            _count: {
                select: { posts: true, followers: true, following: true, favoritePosts: true }
            }
        }
    });

    if (!user) {
        notFound();
    }

    const isOwnProfile = session?.user?.id === user.id;
    const filter = filterParam || 'posts';

    let content;

    // Logic to select content
    if (filter === 'ads' && isOwnProfile) {
        const adsRaw = await prisma.sponsoredPost.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: { payment: true }
        });
        // Serialize to avoid "Date object passed to Client Component" warning/error
        const ads = JSON.parse(JSON.stringify(adsRaw));
        content = (
            <Suspense fallback={<div className="w-full h-40 flex items-center justify-center text-white/40">Loading Ads...</div>}>
                <ProfileAdsList ads={ads} isOwnProfile={isOwnProfile} />
            </Suspense>
        );
    }
    // Simplified: Only implementing Posts and Ads for now to ensure this works. 
    // Expand for Series/Exams if needed or if components are verified compatible.
    else {
        // Fetch posts
        const posts = await prisma.post.findMany({
            where: { authorId: user.id, status: 'PUBLISHED' },
            include: {
                author: true,
                series: true,
                _count: { select: { reviews: true, likedBy: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        content = <ProfilePostList posts={posts as any} isOwnProfile={isOwnProfile} currentFilter={filter} profileUser={user} />;
    }

    const stats = {
        postsCount: user._count.posts,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        favoritesCount: user._count.favoritePosts
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

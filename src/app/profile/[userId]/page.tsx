import { Suspense } from 'react';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import ProfileHeader from '@/components/profile/profile-header';
import ProfilePostList from '@/components/profile/profile-post-list';
import ProfileAdsList from '@/components/profile/profile-ads-list';
import PublicAdList from '@/components/profile/public-ad-list';
import PaymentManager from '@/components/profile/profile-payment-manager';
import ProfileMessages from '@/components/profile/profile-messages';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
    params,
    searchParams
}: {
    params: Promise<{ userId: string }>,
    searchParams: Promise<{ filter?: string, adId?: string }>
}) {
    const session = await auth();
    const { userId } = await params;
    const { filter: filterRaw, adId: adIdRaw } = await searchParams;

    // Ensure params are strings (handle array case)
    const filterParam = Array.isArray(filterRaw) ? filterRaw[0] : filterRaw;
    const adId = Array.isArray(adIdRaw) ? adIdRaw[0] : adIdRaw;

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
    // Logic to select content
    if (filter === 'ads' && isOwnProfile) {
        const adsRaw = await prisma.sponsoredPost.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: { paymentRecord: true }
        });
        const ads = JSON.parse(JSON.stringify(adsRaw));
        content = (
            <Suspense fallback={<div className="w-full h-40 flex items-center justify-center text-white/40">Loading Ads...</div>}>
                <ProfileAdsList ads={ads} isOwnProfile={isOwnProfile} />
            </Suspense>
        );
    } else if (filter === 'ad_view') {
        // If specific adId requested, fetch it first
        let specificAd = null;
        if (adId) {
            specificAd = await prisma.sponsoredPost.findUnique({
                where: { id: adId }
            });
        }

        // Fetch all active/approved ads for this user (excluding the specific one if fetched)
        const activeAdsRaw = await prisma.sponsoredPost.findMany({
            where: {
                userId: user.id,
                status: 'APPROVED',
                isActive: true,
                ...(specificAd ? { id: { not: specificAd.id } } : {})
            },
            orderBy: { createdAt: 'desc' }
        });

        // Combine: specific ad first (if belongs to this user), then active ads
        let allAds = [];
        if (specificAd && specificAd.userId === user.id) {
            allAds = [specificAd, ...activeAdsRaw];
        } else {
            allAds = [...activeAdsRaw];
        }

        const activeAds = JSON.parse(JSON.stringify(allAds));
        content = <PublicAdList ads={activeAds} highlightId={adId} />;
    }
    // Expand for Series/Exams if needed or if components are verified compatible.
    else if (filter === 'payments' && isOwnProfile) {
        // Fetch Payment Data directly here (Server Side) to pass to Client Component
        const plans = await prisma.subscriptionPlan.findMany({
            where: { isArchived: false },
            orderBy: { price: 'asc' }
        });

        const historyRaw = await prisma.paymentRecord.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                subscription: { include: { plan: true } },
                accessKey: true
            }
        });

        const currentSubRaw = await prisma.userSubscription.findFirst({
            where: {
                userId: user.id,
                status: 'ACTIVE',
                endDate: { gt: new Date() }
            },
            include: { plan: true },
            orderBy: { endDate: 'desc' }
        });

        const history = JSON.parse(JSON.stringify(historyRaw));
        const currentSubscription = JSON.parse(JSON.stringify(currentSubRaw));

        content = (
            <PaymentManager
                plans={plans}
                history={history}
                currentSubscription={currentSubscription}
            />
        );

    } else if (filter === 'messages' && isOwnProfile) {
        content = <ProfileMessages user={user} />;
    } else {
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
                adId={adId}
            />

            <div className="px-4 md:px-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
                {content}
            </div>
        </main>
    );
}

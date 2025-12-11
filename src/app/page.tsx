
import { getPosts } from '@/lib/actions/posts/read';
import { getUsers } from '@/lib/actions/users';
import { getPublicGroups } from '@/lib/actions/groups';
import HomePageClient from '@/components/home-page-client';
import { auth } from '@/auth';
import FeaturedPromo from '@/components/home/featured-promo';
import { getPromoData } from '@/lib/actions/promo';
import { getSponsoredPosts, getRecentApprovedAds } from '@/lib/actions/ads';

export default async function HomePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;

    const timeFilter = (params.timeFilter as string) || 'updatedAt-desc';
    const sortBy = (params.sortBy as string) || 'updatedAt-desc';
    const typeFilter = params.type as string | undefined;
    const currentPage = Number(params.page) || 1;
    const lockStatus = params.lockStatus as string | undefined;

    const session = await auth();

    const postDataPromise = typeFilter === 'sponsored'
        ? getRecentApprovedAds(currentPage, 12)
        : getPosts({
            page: currentPage,
            limit: 12,
            filters: { timeFilter, sortBy, type: typeFilter, lockStatus },
        });
    const usersPromise = getUsers({ limit: 10 });
    const groupsPromise = getPublicGroups();
    const promoDataPromise = getPromoData();
    const adsPromise = getSponsoredPosts();

    const [{ posts, totalPages }, users, groups, promoData, ads] = await Promise.all([
        postDataPromise,
        usersPromise,
        groupsPromise,
        promoDataPromise,
        adsPromise
    ]);

    return (
        <main>
            <HomePageClient
                initialPosts={posts}
                initialUsers={users}
                initialGroups={groups}
                totalPages={totalPages}
                initialAds={ads}
                currentPage={currentPage}
                searchParams={{ timeFilter, page: String(currentPage), sortBy, type: typeFilter, lockStatus }}
                session={session}
                promoData={promoData}
            />
        </main>
    );
}

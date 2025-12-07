
import { getPosts } from '@/lib/actions/posts/read';
import { getUsers } from '@/lib/actions/users';
import { getPublicGroups } from '@/lib/actions/groups';
import HomePageClient from '@/components/home-page-client';
import { auth } from '@/auth';

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

    const postDataPromise = getPosts({
        page: currentPage,
        limit: 12,
        filters: { timeFilter, sortBy, type: typeFilter, lockStatus },
    });
    const usersPromise = getUsers({ limit: 10 });
    const groupsPromise = getPublicGroups();

    const [{ posts, totalPages }, users, groups] = await Promise.all([
        postDataPromise,
        usersPromise,
        groupsPromise
    ]);

    return (
        <HomePageClient
            initialPosts={posts}
            initialUsers={users}
            initialGroups={groups}
            totalPages={totalPages}
            currentPage={currentPage}
            searchParams={{ timeFilter, page: String(currentPage), sortBy, type: typeFilter, lockStatus }}
            session={session}
        />
    );
}

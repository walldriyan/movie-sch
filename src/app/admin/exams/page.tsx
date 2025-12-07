
import { getPostsForAdmin, getGroupsForForm, getExamsForAdmin, getExamForEdit } from '@/lib/actions';
import type { Post, Group } from '@prisma/client';
import ExamsClient from '@/components/admin/exams-client';

type PostWithGroup = Post & { group: { name: string } | null };
type ExamForListing = Awaited<ReturnType<typeof getExamsForAdmin>>[0];

export default async function CreateExamPage() {

    // Fetch all necessary data on the server
    const [{ posts: initialPosts }, initialGroups, initialExams] = await Promise.all([
        getPostsForAdmin({ page: 1, limit: 10, userId: 'dummy-id', userRole: 'SUPER_ADMIN', sortBy: 'createdAt-desc' }),
        getGroupsForForm(),
        getExamsForAdmin()
    ]);

    return (
        <ExamsClient
            initialPosts={initialPosts as unknown as PostWithGroup[]}
            initialGroups={initialGroups as Group[]}
            initialExams={initialExams}
        />
    );
}

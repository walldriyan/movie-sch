import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import ResultViewer from '@/components/activity/result-viewer';

export const dynamic = 'force-dynamic';

export default async function ExamResultPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session || !session.user) {
        redirect('/auth');
    }

    const { id } = await params;
    const submissionId = parseInt(id);

    if (isNaN(submissionId)) {
        return notFound();
    }

    const submission = await prisma.examSubmission.findUnique({
        where: { id: submissionId },
        include: {
            exam: {
                include: {
                    questions: {
                        include: {
                            options: true
                        },
                        orderBy: { id: 'asc' }
                    }
                }
            },
            answers: {
                include: {
                    selectedOption: true
                }
            }
        }
    });

    if (!submission) {
        return notFound();
    }

    // Security: Only allow the user who took the exam (or admins) to view it
    if (submission.userId !== session.user.id && session.user.role !== 'SUPER_ADMIN') {
        redirect('/activity'); // Or show 403
    }

    return <ResultViewer submission={submission} user={session.user} />;
}

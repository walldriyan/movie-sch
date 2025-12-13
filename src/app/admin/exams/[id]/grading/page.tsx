import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import ExamResultsClient from '@/components/admin/exam-results-client';

export const dynamic = 'force-dynamic';

export default async function ExamResultsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();

    // Verify Admin Access
    if (!session || !session.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'USER_ADMIN')) {
        redirect('/');
    }

    const { id } = await params;
    const examId = parseInt(id);

    if (isNaN(examId)) return notFound();

    // Fetch Exam with necessary details
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
            questions: {
                // Include details needed for grading context if required by client, 
                // but client mainly uses points and text.
                select: {
                    id: true,
                    points: true,
                    text: true,
                    type: true,
                    options: true,
                    images: true
                },
                orderBy: { id: 'asc' }
            }
        }
    });

    if (!exam) return notFound();

    // Fetch Submissions for this exam
    const submissions = await prisma.examSubmission.findMany({
        where: { examId },
        include: {
            user: {
                select: { id: true, name: true, email: true, image: true }
            },
            answers: true // Include answers as required by ExamResultSubmission type
        },
        orderBy: { submittedAt: 'desc' }
    });

    return <ExamResultsClient exam={exam as any} initialSubmissions={submissions as any} />;
}

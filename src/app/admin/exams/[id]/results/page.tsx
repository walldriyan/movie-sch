
import { getExamResultsForAdmin } from '@/lib/actions/exams';
import ExamResultsClient from '@/components/admin/exam-results-client';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) return redirect('/login');

    const { id } = await params;
    const examId = parseInt(id);

    if (isNaN(examId)) {
        notFound();
    }

    try {
        const { exam, submissions } = await getExamResultsForAdmin(examId);
        return <ExamResultsClient exam={exam} initialSubmissions={submissions} />;
    } catch (error) {
        console.error("Error loading exam results:", error);
        if ((error as Error).message === 'Not authorized') {
            return <div className="p-8 text-center text-destructive">You are not authorized to view this page.</div>;
        }
        return <div className="p-8 text-center">Exam not found or error loading results.</div>;
    }
}

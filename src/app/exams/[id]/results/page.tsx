
import { notFound } from 'next/navigation';
import { getExamResults } from '@/lib/actions';
import { auth } from '@/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ExamResultsClient from './exam-results-client';

interface ExamResultsPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ submissionId?: string }>;
}

export default async function ExamResultsPage({ params, searchParams }: ExamResultsPageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const session = await auth();
    if (!session?.user) {
        return notFound();
    }

    const examId = parseInt(resolvedParams.id, 10);
    const submissionId = resolvedSearchParams.submissionId ? parseInt(resolvedSearchParams.submissionId, 10) : undefined;

    if (isNaN(examId) || !submissionId || isNaN(submissionId)) {
        return notFound();
    }

    try {
        const results = await getExamResults(submissionId);

        // Verify the submission belongs to the requested exam
        if (results.submission.examId !== examId) {
            return notFound();
        }

        return <ExamResultsClient results={results} />;

    } catch (error: any) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert variant="destructive" className="max-w-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {error.message}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
}


import { notFound } from 'next/navigation';
import { getExamForTaker, getExamResults } from '@/lib/actions';
import { auth } from '@/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ExamTaker from '@/components/exam-taker';
import ExamResultsClient from '@/components/exam-results-client';

interface ExamPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string; submissionId?: string }>;
}

export default async function ExamPage({ params, searchParams }: ExamPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const session = await auth();
  if (!session?.user) {
    return notFound();
  }

  const examId = parseInt(resolvedParams.id, 10);
  if (isNaN(examId)) {
    return notFound();
  }

  // Check if viewing results
  if (resolvedSearchParams.view === 'results' && resolvedSearchParams.submissionId) {
    const submissionId = parseInt(resolvedSearchParams.submissionId, 10);
    if (isNaN(submissionId)) {
      return notFound();
    }

    try {
      const results = await getExamResults(submissionId);

      // Verify the submission belongs to the requested exam
      if (results.submission.examId !== examId) {
        return notFound();
      }

      return <ExamResultsClient results={results} />;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  // Show exam taker
  try {
    const exam = await getExamForTaker(examId);

    if (!exam) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Alert variant="destructive" className="max-w-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Exam Not Found</AlertTitle>
            <AlertDescription>
              The exam you are trying to access does not exist or is not currently active.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return <ExamTaker exam={exam} />;

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </div>
    );
  }
}

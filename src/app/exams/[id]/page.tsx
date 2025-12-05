
import { notFound } from 'next/navigation';
import { getExamForTaker } from '@/lib/actions';
import { auth } from '@/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import ExamTaker from '@/components/exam-taker';

interface TakeExamPageProps {
  params: Promise<{ id: string }>;
}

export default async function TakeExamPage({ params }: TakeExamPageProps) {
  const resolvedParams = await params;

  const session = await auth();
  if (!session?.user) {
    return notFound();
  }

  const examId = parseInt(resolvedParams.id, 10);
  if (isNaN(examId)) {
    return notFound();
  }

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

  } catch (error: any) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}

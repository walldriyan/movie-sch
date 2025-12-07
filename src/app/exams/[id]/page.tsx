
import { notFound } from 'next/navigation';
import { getExamForTaker, getExamResults } from '@/lib/actions';
import { auth } from '@/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, X, ArrowLeft, Download, RotateCcw } from 'lucide-react';
import ExamTaker from '@/components/exam-taker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
      const { submission, submissionCount, user } = await getExamResults(submissionId);

      // Verify the submission belongs to the requested exam
      if (submission.examId !== examId) {
        return notFound();
      }

      const totalPoints = submission.exam.questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = totalPoints > 0 ? (submission.score / totalPoints) * 100 : 0;

      return (
        <div className="min-h-screen bg-background py-8 px-4 pt-24">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                <Link href={`/exams/${examId}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <p className="text-sm text-muted-foreground">Your Results</p>
                <h1 className="font-semibold text-2xl">{submission.exam.title}</h1>
              </div>
            </div>

            {/* Score Card */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Complete!</CardTitle>
                <CardDescription>
                  Attempt #{submissionCount} • {submission.exam.questions.length} questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="text-4xl font-bold">{submission.score}/{totalPoints}</div>
                  <Badge variant={percentage >= 50 ? 'default' : 'destructive'} className="text-lg px-4 py-1">
                    {percentage.toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-2">
                  {percentage >= 50 ? 'Congratulations! You passed!' : 'Keep trying! You can do better!'}
                </p>
              </CardContent>
            </Card>

            {/* Questions Review */}
            <Card>
              <CardHeader>
                <CardTitle>Questions Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {submission.exam.questions.map((question, qIndex) => {
                  const userAnswer = submission.answers.find(a => a.questionId === question.id);
                  const selectedOption = question.options.find(o => o.id === userAnswer?.selectedOptionId);
                  const correctOption = question.options.find(o => o.isCorrect);
                  const isCorrect = selectedOption?.isCorrect;

                  return (
                    <div key={question.id} className="space-y-3 pb-6 border-b last:border-0">
                      <div className="flex items-start gap-3">
                        <span className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm",
                          isCorrect ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                        )}>
                          {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </span>
                        <div>
                          <p className="font-medium">Q{qIndex + 1}. {question.text}</p>
                          <p className="text-sm text-muted-foreground">({question.points} points)</p>
                        </div>
                      </div>

                      <div className="ml-9 space-y-2">
                        {question.type === 'MCQ' ? (
                          <>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Your answer:</span>{' '}
                              <span className={isCorrect ? 'text-green-500' : 'text-red-500'}>
                                {selectedOption?.text || 'No answer'}
                              </span>
                            </p>
                            {!isCorrect && correctOption && (
                              <p className="text-sm">
                                <span className="text-muted-foreground">Correct answer:</span>{' '}
                                <span className="text-green-500">{correctOption.text}</span>
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Your answer:</span>{' '}
                            {userAnswer?.customAnswer || 'No answer provided'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 print:hidden">
              <Button asChild>
                <Link href={`/exams/${examId}`}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/exams/${examId}?view=results&submissionId=${submissionId}&print=true`}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </div>
        </div>
      );
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

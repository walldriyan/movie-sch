
import { notFound } from 'next/navigation';
import { getExamForTaker, submitExam } from '@/lib/actions';
import { auth } from '@/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Timer, ChevronsRight, Send } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default async function TakeExamPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    // Redirect to login or show an error
    return notFound();
  }

  const examId = parseInt(params.id, 10);
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
    
    const submitExamWithId = submitExam.bind(null, exam.id);

    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold font-serif">{exam.title}</CardTitle>
              <CardDescription className="flex items-center gap-4 pt-2">
                {exam.durationMinutes && (
                  <span className="flex items-center gap-1.5">
                    <Timer className="h-4 w-4" /> {exam.durationMinutes} minutes
                  </span>
                )}
                 <span>{exam.questions.length} questions</span>
              </CardDescription>
              {exam.description && <p className="pt-2 text-muted-foreground">{exam.description}</p>}
            </CardHeader>
            <form action={submitExamWithId}>
                <CardContent className="space-y-8">
                    {exam.questions.map((question, qIndex) => (
                        <div key={question.id}>
                             <Separator className={qIndex > 0 ? 'mb-8' : ''}/>
                             <div className="font-semibold text-lg">{qIndex + 1}. {question.text}</div>
                             <p className="text-sm text-muted-foreground mb-4">{question.points} points</p>
                             <RadioGroup name={`question-${question.id}`} required className="space-y-2">
                                {question.options.map(option => (
                                    <div key={option.id} className="flex items-center space-x-2 p-3 rounded-lg border border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                        <RadioGroupItem value={String(option.id)} id={`option-${option.id}`} />
                                        <Label htmlFor={`option-${option.id}`} className="flex-grow cursor-pointer">{option.text}</Label>
                                    </div>
                                ))}
                             </RadioGroup>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                    <Button type="submit" size="lg">
                        <Send className="mr-2 h-4 w-4" />
                        Submit Exam
                    </Button>
                </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
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

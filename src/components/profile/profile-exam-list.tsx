

'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookCheck, Clapperboard, FileQuestion, PlayCircle, VideoOff, Award, Clock, Repeat } from 'lucide-react';
import type { ExamWithSubmissions } from '@/lib/types';
import { Separator } from '../ui/separator';

interface ProfileExamListProps {
  exams: ExamWithSubmissions[];
  isOwnProfile: boolean;
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <div className="flex-shrink-0">{icon}</div>
    <div className="flex-grow">
      <span className="font-semibold">{label}:</span> {value}
    </div>
  </div>
);

export default function ProfileExamList({ exams, isOwnProfile }: ProfileExamListProps) {
  if (!isOwnProfile) {
    return (
      <Card className="text-center border-dashed">
        <CardContent className="p-16 flex flex-col items-center gap-4">
          <BookCheck className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Private Content</h3>
          <p className="text-muted-foreground">You can only view your own exams.</p>
        </CardContent>
      </Card>
    );
  }

  if (exams.length === 0) {
    return (
      <Card className="text-center border-dashed">
        <CardContent className="p-16 flex flex-col items-center gap-4">
          <VideoOff className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Exams Available</h3>
          <p className="text-muted-foreground">There are no exams available for you to take at the moment.</p>
           <Button asChild className="mt-4">
                <Link href="/">Browse Content</Link>
           </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {exams.map((exam) => {
        const lastSubmission = exam.submissions.length > 0 ? exam.submissions[0] : null;
        const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
        const lastScore = lastSubmission?.score ?? null;
        const lastPercentage = lastScore !== null && totalPoints > 0 ? (lastScore / totalPoints) * 100 : null;
        const timeTaken = lastSubmission?.timeTakenSeconds ?? null;
        const attemptsMade = exam.submissions.length;
        const attemptsLeft = exam.attemptsAllowed === 0 ? 'Unlimited' : exam.attemptsAllowed - attemptsMade;
        
        return (
          <Card key={exam.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{exam.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 pt-2">
                  <Clapperboard className="h-4 w-4" />
                  From: {exam.post.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <DetailItem icon={<FileQuestion className="h-4 w-4" />} label="Questions" value={exam._count.questions} />
              
              {lastSubmission && (
                  <>
                    <Separator />
                    <DetailItem 
                        icon={<Award className="h-4 w-4" />} 
                        label="Last Score" 
                        value={`${lastScore}/${totalPoints} (${lastPercentage?.toFixed(0)}%)`} 
                    />
                    {timeTaken !== null && (
                        <DetailItem 
                            icon={<Clock className="h-4 w-4" />} 
                            label="Time Taken" 
                            value={`${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`}
                        />
                    )}
                  </>
              )}
               <Separator />
               <DetailItem 
                    icon={<Repeat className="h-4 w-4" />} 
                    label="Attempts" 
                    value={`${attemptsMade} made, ${attemptsLeft} left`} 
                />
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" disabled={exam.attemptsAllowed > 0 && attemptsMade >= exam.attemptsAllowed}>
                <Link href={`/exams/${exam.id}`}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                   {attemptsMade > 0 ? 'Retake Exam' : 'Start Exam'}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

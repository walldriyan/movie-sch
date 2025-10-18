
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookCheck, Clapperboard, FileQuestion, PlayCircle, VideoOff } from 'lucide-react';
import type { Exam } from '@prisma/client';

type ExamWithPostAndCount = Exam & {
    post: { title: string };
    _count: { questions: number };
};

interface ProfileExamListProps {
  exams: ExamWithPostAndCount[];
  isOwnProfile: boolean;
}

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
      {exams.map((exam) => (
        <Card key={exam.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{exam.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 pt-2">
                <Clapperboard className="h-4 w-4" />
                From: {exam.post.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileQuestion className="h-4 w-4" />
              <span>{exam._count.questions} questions</span>
            </div>
            {exam.description && <p className="text-sm text-muted-foreground mt-4 line-clamp-3">{exam.description}</p>}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/exams/${exam.id}`}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Start Exam
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

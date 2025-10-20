
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { BookCheck, Clapperboard, FileQuestion, PlayCircle, VideoOff, Award, Clock, Repeat, Users, Download, Eye, Loader2, Target, Check, X, CircleDot, Pencil, Calendar, User, Hash, MoreHorizontal } from 'lucide-react';
import type { ExamWithSubmissions, ExamResultSubmission } from '@/lib/types';
import { Separator } from '../ui/separator';
import { getExamResults } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Film } from 'lucide-react';
import ClientSideDate from '../manage/client-side-date';

type ExamResults = Awaited<ReturnType<typeof getExamResults>>;

const formatTime = (totalSeconds: number | null | undefined): string => {
    if (totalSeconds === null || totalSeconds === undefined) return 'N/A';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
};

// New component for the printable/dialog view, adapted from results page
const SubmissionResultView = ({ results }: { results: ExamResults }) => {
    if (!results) return null;

    const { submission, user } = results;
    const totalPoints = submission.exam.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = totalPoints > 0 ? (submission.score / totalPoints) * 100 : 0;
    
    return (
        <div className="printable-area font-sans text-black bg-white p-6">
             <header className="text-center mb-10 border-b-2 border-gray-200 pb-6">
                <div className="inline-flex items-center space-x-3 mb-4">
                    <Film className="h-8 w-8 text-primary" />
                    <span className="inline-block font-bold text-3xl text-gray-800" style={{fontFamily: 'serif'}}>
                        CineVerse
                    </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800" style={{fontFamily: 'serif'}}>{submission.exam.title}</h1>
                <p className="text-lg text-gray-500" style={{fontFamily: 'serif'}}>Exam Result Certificate</p>
            </header>

            <main>
                <section className="mb-8">
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-700">Submission Details</h2>
                     <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-base">
                         <div className="flex items-center gap-2">
                             <User className="h-4 w-4 text-gray-500" />
                             <strong>Student:</strong>
                             <span>{user.name}</span>
                         </div>
                          <div className="flex items-center gap-2">
                             <Calendar className="h-4 w-4 text-gray-500" />
                             <strong>Date:</strong>
                             <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                         </div>
                     </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-700">Overall Score</h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <p className="text-sm text-gray-500">Total Score</p>
                            <p className="text-3xl font-bold text-primary">{submission.score} / {totalPoints}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <p className="text-sm text-gray-500">Percentage</p>
                            <p className="text-3xl font-bold text-gray-700">{percentage.toFixed(0)}%</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <p className="text-sm text-gray-500">Result</p>
                            <p className={`text-3xl font-bold ${percentage >= 50 ? 'text-green-500' : 'text-red-500'}`}>{percentage >= 50 ? "Passed" : "Failed"}</p>
                        </div>
                    </div>
                </section>
                
                 <section>
                    <h2 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-700">Answer Review</h2>
                    <div className="space-y-6">
                        {submission.exam.questions.map((question, index) => {
                            const userAnswers = submission.answers.filter(a => a.questionId === question.id);
                            
                            return (
                                <div key={question.id} className="p-4 border border-gray-200 rounded-lg break-inside-avoid">
                                    <p className="font-bold text-gray-800 text-base">{index + 1}. {question.text} <span className="font-normal text-gray-500">({question.points} points)</span></p>
                                    
                                     {question.type === 'MCQ' ? (
                                        <div className="mt-3 space-y-2">
                                            {question.options.map(option => {
                                                const isUserChoice = userAnswers.some(a => a.selectedOptionId === option.id);
                                                const isTheCorrectAnswer = option.isCorrect;
                                                
                                                return (
                                                    <div 
                                                        key={option.id}
                                                        className={cn(
                                                            "flex items-start gap-2 p-2 rounded-md text-sm border",
                                                            isTheCorrectAnswer && "bg-green-50 border-green-300",
                                                            isUserChoice && !isTheCorrectAnswer && "bg-red-50 border-red-300"
                                                        )}
                                                    >
                                                        <div className='flex-shrink-0 pt-0.5'>
                                                            {isUserChoice && isTheCorrectAnswer && <Check className="h-4 w-4 text-green-500" />}
                                                            {isUserChoice && !isTheCorrectAnswer && <X className="h-4 w-4 text-red-500" />}
                                                            {!isUserChoice && isTheCorrectAnswer && <Target className="h-4 w-4 text-green-500" />}
                                                            {!isUserChoice && !isTheCorrectAnswer && <FileQuestion className="h-4 w-4 text-gray-400" />}
                                                        </div>
                                                        <div className="flex-grow">
                                                            <p className={cn(isTheCorrectAnswer && 'font-semibold', isUserChoice && !isTheCorrectAnswer && 'line-through')}>{option.text}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                     ) : (
                                        <div className="mt-3 space-y-3">
                                            <div className="p-3 rounded-md bg-gray-50 border">
                                                <p className="text-xs font-semibold text-gray-600 mb-1">Your Answer:</p>
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{userAnswers[0]?.customAnswer || 'No answer provided.'}</p>
                                            </div>
                                            {userAnswers[0]?.marksAwarded !== null && userAnswers[0]?.marksAwarded !== undefined ? (
                                                <div className="mt-2 p-2 bg-green-50 border-green-200 rounded-lg text-sm border">
                                                    <p className="font-semibold text-green-800 flex items-center gap-2">
                                                        <Check className="h-4 w-4" />
                                                        Graded: {userAnswers[0].marksAwarded} / {question.points} points
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="mt-2 p-2 bg-blue-50 border-blue-200 rounded-lg text-sm border">
                                                    <p className="font-semibold text-blue-800 flex items-center gap-2">
                                                        <Pencil className="h-4 w-4" />Answer Pending Review
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
            
            <footer className="text-center mt-10 pt-6 border-t-2 border-gray-200 text-gray-400 text-xs">
                <p>This is an automatically generated certificate from CineVerse Learning Platform.</p>
                <p>&copy; {new Date().getFullYear()} CineVerse. All rights reserved.</p>
            </footer>
        </div>
    );
};


function ExamResultsDialog({ submissionId, children }: { submissionId: number, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<ExamResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchResults = async () => {
    if (!submissionId) return;
    setIsLoading(true);
    try {
      const data = await getExamResults(submissionId);
      setResults(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !results) { // Fetch only if opening and no results yet
      fetchResults();
    } else if (!open) { // Reset state when closing
        setResults(null);
        setIsLoading(false);
    }
  };
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = document.querySelector('.printable-area')?.innerHTML;
    
    if (printWindow && printContent) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Results</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @media print {
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .no-print { display: none !important; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
             printWindow.print();
             printWindow.close();
        }, 250);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col no-print">
        <DialogHeader>
          <DialogTitle>Exam Results</DialogTitle>
          <DialogDescription>
            Your results for this attempt.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
             <ScrollArea className="h-full pr-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : results ? (
                    <SubmissionResultView results={results} />
                ) : (
                    <p>Could not load results.</p>
                )}
            </ScrollArea>
        </div>
        <DialogFooter>
           <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
           <Button type="button" onClick={handlePrint} disabled={isLoading || !results}>
            <Download className="mr-2 h-4 w-4" /> Download as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


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
                  {exam.post ? (
                    <>
                      <Clapperboard className="h-4 w-4" />
                      From: {exam.post.title}
                    </>
                  ) : exam.group ? (
                     <>
                      <Users className="h-4 w-4" />
                      Group: {exam.group.name}
                    </>
                  ) : null}
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
            <CardFooter className="flex flex-col items-stretch gap-2">
                <Button asChild className="w-full" disabled={exam.attemptsAllowed > 0 && attemptsMade >= exam.attemptsAllowed}>
                  <Link href={`/exams/${exam.id}`}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {attemptsMade > 0 ? 'Retake Exam' : 'Start Exam'}
                  </Link>
                </Button>
                {lastSubmission && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="secondary" className="w-full">
                          <Eye className="mr-2 h-4 w-4" /> View Results
                          <MoreHorizontal className="ml-auto h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                      <DropdownMenuLabel>Previous Attempts</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                       {exam.submissions.map((sub, index) => (
                          <ExamResultsDialog key={sub.id} submissionId={sub.id}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              Attempt {exam.submissions.length - index}: {sub.score}/{totalPoints}
                              <span className="ml-auto text-xs text-muted-foreground">
                                <ClientSideDate date={sub.submittedAt} formatString="PPp" />
                              </span>
                            </DropdownMenuItem>
                          </ExamResultsDialog>
                       ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}


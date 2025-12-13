
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  BookCheck, Clapperboard, FileQuestion, PlayCircle, VideoOff, Award, Clock, Repeat, Users, Download, Eye, Loader2, Target, Check, X, CircleDot, Pencil, Calendar, User, Hash, MoreHorizontal,
  Trophy, Percent, Activity, CalendarDays, History
} from 'lucide-react';
import type { ExamWithSubmissions, ExamResultSubmission } from '@/lib/types';
import { Separator } from '../ui/separator';
import { getExamResults } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Film } from 'lucide-react';
import ClientSideDate from '../manage/client-side-date';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type ExamResults = Awaited<ReturnType<typeof getExamResults>>;

const formatTime = (totalSeconds: number | null | undefined): string => {
  if (totalSeconds === null || totalSeconds === undefined) return 'N/A';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

// ... SubmissionResultView Component ...
const SubmissionResultView = ({ results }: { results: ExamResults }) => {
  if (!results) return null;
  const { submission, user } = results;
  const totalPoints = submission.exam.questions.reduce((sum, q) => sum + q.points, 0);
  const percentage = totalPoints > 0 ? (submission.score / totalPoints) * 100 : 0;

  return (
    <div className="printable-area font-sans text-black bg-white p-6">
      <header className="text-center mb-10 border-b-2 border-gray-200 pb-6">
        <div className="inline-flex items-center space-x-3 mb-4"><Film className="h-8 w-8 text-primary" /><span className="inline-block font-bold text-3xl text-gray-800" style={{ fontFamily: 'serif' }}>CineVerse</span></div>
        <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'serif' }}>{submission.exam.title}</h1><p className="text-lg text-gray-500" style={{ fontFamily: 'serif' }}>Exam Result Certificate</p>
      </header>
      <main>
        <section className="mb-8"><h2 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-700">Submission Details</h2><div className="grid grid-cols-2 gap-x-6 gap-y-3 text-base"><div className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500" /><strong>Student:</strong><span>{user.name}</span></div><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-500" /><strong>Date:</strong><span>{new Date(submission.submittedAt).toLocaleDateString()}</span></div></div></section>
        <section className="mb-8"><h2 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-700">Overall Score</h2><div className="grid grid-cols-3 gap-4 text-center"><div className="bg-gray-50 p-4 rounded-lg border"><p className="text-sm text-gray-500">Total Score</p><p className="text-3xl font-bold text-primary">{submission.score} / {totalPoints}</p></div><div className="bg-gray-50 p-4 rounded-lg border"><p className="text-sm text-gray-500">Percentage</p><p className="text-3xl font-bold text-gray-700">{percentage.toFixed(0)}%</p></div><div className="bg-gray-50 p-4 rounded-lg border"><p className="text-sm text-gray-500">Result</p><p className={`text-3xl font-bold ${percentage >= 50 ? 'text-green-500' : 'text-red-500'}`}>{percentage >= 50 ? "Passed" : "Failed"}</p></div></div></section>
        <section><h2 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-700">Answer Review</h2><div className="space-y-6">{submission.exam.questions.map((question, index) => { const userAnswers = submission.answers.filter(a => a.questionId === question.id); return (<div key={question.id} className="p-4 border border-gray-200 rounded-lg break-inside-avoid"><p className="font-bold text-gray-800 text-base">{index + 1}. {question.text} <span className="font-normal text-gray-500">({question.points} points)</span></p>{question.type === 'MCQ' ? (<div className="mt-3 space-y-2">{question.options.map(option => { const isUserChoice = userAnswers.some(a => a.selectedOptionId === option.id); const isTheCorrectAnswer = option.isCorrect; return (<div key={option.id} className={cn("flex items-start gap-2 p-2 rounded-md text-sm border", isTheCorrectAnswer && "bg-green-50 border-green-300", isUserChoice && !isTheCorrectAnswer && "bg-red-50 border-red-300")}><div className='flex-shrink-0 pt-0.5'>{isUserChoice && isTheCorrectAnswer && <Check className="h-4 w-4 text-green-500" />}{isUserChoice && !isTheCorrectAnswer && <X className="h-4 w-4 text-red-500" />}{!isUserChoice && isTheCorrectAnswer && <Target className="h-4 w-4 text-green-500" />}{!isUserChoice && !isTheCorrectAnswer && <FileQuestion className="h-4 w-4 text-gray-400" />}</div><div className="flex-grow"><p className={cn(isTheCorrectAnswer && 'font-semibold', isUserChoice && !isTheCorrectAnswer && 'line-through')}>{option.text}</p></div></div>); })}</div>) : (<div className="mt-3 space-y-3"><div className="p-3 rounded-md bg-gray-50 border"><p className="text-xs font-semibold text-gray-600 mb-1">Your Answer:</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{userAnswers[0]?.customAnswer || 'No answer provided.'}</p></div>{userAnswers[0]?.marksAwarded !== null && userAnswers[0]?.marksAwarded !== undefined ? (<div className="mt-2 p-2 bg-green-50 border-green-200 rounded-lg text-sm border"><p className="font-semibold text-green-800 flex items-center gap-2"><Check className="h-4 w-4" />Graded: {userAnswers[0].marksAwarded} / {question.points} points</p></div>) : (<div className="mt-2 p-2 bg-blue-50 border-blue-200 rounded-lg text-sm border"><p className="font-semibold text-blue-800 flex items-center gap-2"><Pencil className="h-4 w-4" />Answer Pending Review</p></div>)}</div>)}</div>); })}</div></section>
      </main>
      <footer className="text-center mt-10 pt-6 border-t-2 border-gray-200 text-gray-400 text-xs"><p>This is an automatically generated certificate from CineVerse Learning Platform.</p><p>&copy; {new Date().getFullYear()} CineVerse. All rights reserved.</p></footer>
    </div>
  );
};

function ExamResultsDialog({ submissionId, children }: { submissionId: number, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<ExamResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchResults = async () => { if (!submissionId) return; setIsLoading(true); try { const data = await getExamResults(submissionId); setResults(data); } catch (e: any) { console.error(e); } finally { setIsLoading(false); } };
  const handleOpenChange = (open: boolean) => { setIsOpen(open); if (open && !results) { fetchResults(); } else if (!open) { setResults(null); setIsLoading(false); } };
  const handlePrint = () => { const printWindow = window.open('', '_blank'); const printContent = document.querySelector('.printable-area')?.innerHTML; if (printWindow && printContent) { printWindow.document.write(`<html><head><title>Print</title><script src="https://cdn.tailwindcss.com/"></script><style>@media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none !important; } }</style></head><body>${printContent}</body></html>`); printWindow.document.close(); setTimeout(() => { printWindow.print(); printWindow.close(); }, 250); } };
  return (<Dialog open={isOpen} onOpenChange={handleOpenChange}><DialogTrigger asChild>{children}</DialogTrigger><DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col no-print"><DialogHeader><DialogTitle>Exam Results</DialogTitle><DialogDescription>Your results for this attempt.</DialogDescription></DialogHeader><div className="flex-grow overflow-hidden"><ScrollArea className="h-full pr-4">{isLoading ? <div className="flex justify-center h-full items-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div> : results ? <SubmissionResultView results={results} /> : <p>Could not load.</p>}</ScrollArea></div><DialogFooter><Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button><Button onClick={handlePrint} disabled={isLoading || !results}><Download className="mr-2 h-4 w-4" /> PDF</Button></DialogFooter></DialogContent></Dialog>);
}

const StatsCard = ({ icon, label, value, subtext }: { icon: React.ReactNode, label: string, value: string, subtext?: string }) => (
  <Card className="flex flex-col justify-between overflow-hidden relative bg-[#111112] backdrop-blur-md border border-white/[0.02] rounded-sm hover:border-white/[0.1] transition-all">
    <div className="absolute right-2 top-2 opacity-5 scale-150 transform">{icon}</div><CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">{icon} {label}</CardTitle></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold">{value}</div>{subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}</CardContent>
  </Card>
);

interface ProfileExamListProps {
  exams: ExamWithSubmissions[];
  isOwnProfile: boolean;
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (<div className="flex items-center gap-2 text-sm text-muted-foreground"><div className="flex-shrink-0">{icon}</div><div className="flex-grow"><span className="font-semibold">{label}:</span> {value}</div></div>);

export default function ProfileExamList({ exams, isOwnProfile }: ProfileExamListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  if (!isOwnProfile) {
    return <Card className="text-center border-dashed"><CardContent className="p-16 flex flex-col items-center gap-4"><BookCheck className="h-16 w-16 text-muted-foreground" /><h3 className="text-lg font-semibold">Private Content</h3><p className="text-muted-foreground">You can only view your own exams.</p></CardContent></Card>;
  }

  if (exams.length === 0) {
    return <Card className="text-center border-dashed"><CardContent className="p-16 flex flex-col items-center gap-4"><VideoOff className="h-16 w-16 text-muted-foreground" /><h3 className="text-lg font-semibold">No Exams Available</h3><p className="text-muted-foreground">There are no exams available for you to take at the moment.</p><Button asChild className="mt-4"><Link href="/">Browse Content</Link></Button></CardContent></Card>;
  }

  // Calculate Stats
  const totalExams = exams.length;
  const totalAttempts = exams.reduce((acc, e) => acc + e.submissions.length, 0);

  let sumPercentage = 0;
  let examsAccepted = 0;
  exams.forEach(e => {
    if (e.submissions.length > 0) {
      const sorted = [...e.submissions].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      const latest = sorted[0];
      const totalPoints = e.questions.reduce((s, q) => s + q.points, 0);
      if (totalPoints > 0) {
        sumPercentage += (latest.score / totalPoints) * 100;
        examsAccepted++;
      }
    }
  });
  const avgScore = examsAccepted > 0 ? (sumPercentage / examsAccepted).toFixed(1) : "0";

  // Flatten for History Table
  const historyList = exams.flatMap(e => {
    const totalPoints = e.questions.reduce((sum, q) => sum + q.points, 0);
    return e.submissions.map(sub => ({
      id: sub.id,
      examId: e.id,
      title: e.title,
      attempt: sub.attemptCount,
      score: sub.score,
      totalPoints,
      submittedAt: sub.submittedAt,
      percentage: totalPoints > 0 ? (sub.score / totalPoints) * 100 : 0
    }));
  }).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  // Pagination Logic
  const totalPages = Math.ceil(historyList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistory = historyList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard icon={<Trophy className="h-4 w-4 text-yellow-500" />} label="Exams Taken" value={totalExams.toString()} subtext="Different exams" />
        <StatsCard icon={<Activity className="h-4 w-4 text-blue-500" />} label="Total Attempts" value={totalAttempts.toString()} subtext="All submissions" />
        <StatsCard icon={<Percent className="h-4 w-4 text-green-500" />} label="Avg. Score" value={`${avgScore}%`} subtext="Latest attempts" />
        <StatsCard icon={<CalendarDays className="h-4 w-4 text-purple-500" />} label="Last Active" value={historyList.length > 0 ? new Date(historyList[0].submittedAt).toLocaleDateString() : 'N/A'} subtext="Most recent exam" />
      </div>

      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground/90"><BookCheck className="h-5 w-5 text-primary" /> Active Exams</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const sortedSubmissions = [...exam.submissions].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
            const lastSubmission = sortedSubmissions.length > 0 ? sortedSubmissions[0] : null;
            const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
            const lastScore = lastSubmission?.score ?? null;
            const lastPercentage = lastScore !== null && totalPoints > 0 ? (lastScore / totalPoints) * 100 : null;
            const timeTaken = lastSubmission?.timeTakenSeconds ?? null;
            const attemptsMade = exam.submissions.length;
            const attemptsLeft = exam.attemptsAllowed === 0 ? 'Unlimited' : exam.attemptsAllowed - attemptsMade;

            return (
              <Card key={exam.id} className="flex flex-col border border-white/[0.02] rounded-sm shadow-sm bg-[#111112] backdrop-blur-sm hover:border-white/[0.1] transition-all duration-300">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{exam.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-2 line-clamp-1">
                    {exam.post ? (<><Clapperboard className="h-3 w-3" />{exam.post.title}</>) : exam.group ? (<><Users className="h-3 w-3" />{exam.group.name}</>) : null}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-secondary/20 rounded-lg">
                    <div><p className="text-xs text-muted-foreground">Score</p><p className={`font-bold ${lastPercentage !== null && lastPercentage >= 50 ? 'text-green-500' : lastPercentage !== null ? 'text-red-500' : ''}`}>{lastScore !== null ? `${lastScore}/${totalPoints}` : '-'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Status</p><p className="font-bold text-xs pt-1">{lastPercentage !== null ? (lastPercentage >= 50 ? 'PASS' : 'FAIL') : 'NEW'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Attempts</p><p className="font-bold">{attemptsMade}</p></div>
                  </div>
                  {timeTaken !== null && <DetailItem icon={<Clock className="h-4 w-4" />} label="Time" value={formatTime(timeTaken)} />}
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2 pt-0">
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button asChild variant={attemptsMade > 0 ? "outline" : "default"} disabled={exam.attemptsAllowed > 0 && attemptsMade >= exam.attemptsAllowed}>
                      <Link href={`/exams/${exam.id}`}><PlayCircle className="mr-2 h-4 w-4" />{attemptsMade > 0 ? 'Retake' : 'Start'}</Link>
                    </Button>
                    {exam.submissions.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="secondary"><History className="mr-2 h-4 w-4" /> History</Button></DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                          <DropdownMenuLabel>Attempt History</DropdownMenuLabel><DropdownMenuSeparator />
                          {sortedSubmissions.map((sub, index) => (
                            <ExamResultsDialog key={sub.id} submissionId={sub.id}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                <div className="flex flex-col gap-0.5"><span className="font-medium">Attempt {sub.attemptCount}</span><span className="text-xs text-muted-foreground"><ClientSideDate date={sub.submittedAt} formatString="PP" /></span></div>
                                <span className={`ml-auto font-bold ${((sub.score / totalPoints) * 100) >= 50 ? 'text-green-500' : 'text-red-500'}`}>{sub.score}/{totalPoints}</span>
                              </DropdownMenuItem>
                            </ExamResultsDialog>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button variant="secondary" disabled><History className="mr-2 h-4 w-4" /> History</Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {historyList.length > 0 && (
        <section className="bg-[#111112] rounded-sm border border-white/[0.02] p-6 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-foreground/90"><History className="h-5 w-5 text-primary" /> Recent Activity</h3>
            <Badge variant="outline">{historyList.length} Records</Badge>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="w-[300px]">Exam</TableHead><TableHead>Date</TableHead><TableHead>Attempt</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedHistory.map((item) => (
                  <TableRow key={item.id} className="cursor-default hover:bg-white/5 border-white/10 transition-colors">
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="text-muted-foreground text-xs"><ClientSideDate date={item.submittedAt} formatString="PPP p" /></TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">#{item.attempt}</Badge></TableCell>
                    <TableCell><span className="font-bold">{item.score}</span> <span className="text-muted-foreground text-xs">/ {item.totalPoints}</span></TableCell>
                    <TableCell><Badge className={item.percentage >= 50 ? "bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50" : "bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50"} variant="outline">{item.percentage >= 50 ? 'Passed' : 'Failed'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <ExamResultsDialog submissionId={item.id}><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /><span className="sr-only">View</span></Button></ExamResultsDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={page === currentPage}
                        onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

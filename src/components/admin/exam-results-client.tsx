
'use client';

import React, { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import type { Exam, User, ExamSubmission as PrismaSubmission } from '@prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, MoreHorizontal, Eye, Edit, Trash2, Loader2, Check, X, Target, FileQuestion, CircleDot, Pencil, Save } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { getExamResultsForAdmin, updateSubmissionAttempts, getExamResults, gradeCustomAnswer } from '@/lib/actions';
import type { ExamResultSubmission } from '@/lib/types';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import ClientSideDate from '@/components/manage/client-side-date';
import { Textarea } from '../ui/textarea';

type ExamResultsType = Awaited<ReturnType<typeof getExamResults>>;

function ManageAttemptsDialog({ submission, onUpdate }: { submission: ExamResultSubmission, onUpdate: () => void }) {
    const [open, setOpen] = useState(false);
    const [attemptCount, setAttemptCount] = useState(submission.attemptCount ?? 0);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateSubmissionAttempts(submission.id, submission.userId, attemptCount);
                toast({ title: 'Success', description: `Attempts for ${submission.user.name} updated.`});
                onUpdate();
                setOpen(false);
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        });
    };
    
    return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4"/>Manage Attempts
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Attempts for {submission.user.name}</DialogTitle>
                    <DialogDescription>
                        Set the number of times this user can attempt the exam.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="attempts">Allowed Attempts</Label>
                    <Input 
                        id="attempts"
                        type="number"
                        value={attemptCount ?? ''}
                        onChange={(e) => setAttemptCount(Number(e.target.value))}
                        min="0"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const numberToSinhala = (num: number) => {
    const words = ["", "පළමු", "දෙවන", "තෙවන", "හතරවන", "පස්වන", "හයවන", "හත්වන", "අටවන", "නවවන", "දසවන"];
    if (num <= 10) return words[num];
    return `${num} වන`;
}

function ManualGradeForm({ submissionId, question, answer, onGradeSaved }: { submissionId: number, question: any, answer: any, onGradeSaved: () => void }) {
    const [marks, setMarks] = useState(answer?.marksAwarded?.toString() ?? '');
    const [isSaving, startSaving] = useTransition();
    const { toast } = useToast();

    const handleSave = () => {
        const marksNum = parseInt(marks, 10);
        if (isNaN(marksNum) || marksNum < 0 || marksNum > question.points) {
            toast({ variant: 'destructive', title: 'Invalid Marks', description: `Marks must be between 0 and ${question.points}` });
            return;
        }

        startSaving(async () => {
            try {
                await gradeCustomAnswer(submissionId, question.id, marksNum);
                toast({ title: 'Marks Saved', description: `Question graded successfully.` });
                onGradeSaved();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        });
    }

    return (
        <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 space-y-2">
            <Label htmlFor={`marks-${question.id}`} className="font-semibold text-blue-300 flex items-center gap-2">
                <Pencil className="h-4 w-4" />Manual Grading
            </Label>
            <div className="flex items-center gap-2">
                <Input
                    id={`marks-${question.id}`}
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    placeholder="Marks"
                    max={question.points}
                    min="0"
                    className="w-24 bg-background/50"
                    disabled={isSaving || answer?.marksAwarded !== null}
                />
                <span className="text-sm font-semibold text-muted-foreground">/ {question.points}</span>
                <Button size="sm" onClick={handleSave} disabled={isSaving || answer?.marksAwarded !== null} className="ml-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (answer?.marksAwarded !== null ? <Check className="mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4" />)}
                    {answer?.marksAwarded !== null ? 'Graded' : 'Save Marks'}
                </Button>
            </div>
        </div>
    );
}

function ViewSubmissionDialog({ submissionId, exam }: { submissionId: number, exam: any }) {
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<ExamResultsType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchResults = async () => {
        setIsLoading(true);
        try {
            const data = await getExamResults(submissionId);
            setResults(data);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
            setOpen(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen && !results) {
            fetchResults();
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Eye className="mr-2 h-4 w-4"/>View Submission
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Submission Review</DialogTitle>
                    <DialogDescription>
                        Reviewing answers for {results?.user.name} on &quot;{exam.title}&quot;.
                         {results && <div className="font-bold text-foreground">Total Score: {results.submission.score}</div>}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full pr-6 -mr-6">
                        {isLoading && (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        {results && (
                             <div className="space-y-4 py-4">
                                {results.submission.exam.questions.map((question, index) => {
                                    const userAnswer = results.submission.answers.find(a => a.questionId === question.id);
                                    
                                    return (
                                        <React.Fragment key={question.id}>
                                        <Card className="bg-card/30 border-dashed p-6">
                                            <CardHeader className="p-0 mb-4">
                                                <CardDescription className="font-serif text-xs text-muted-foreground uppercase tracking-wider">{numberToSinhala(index + 1)} ප්‍රශ්නය</CardDescription>
                                                <CardTitle className="text-lg">{question.text} <span className="text-sm font-normal text-muted-foreground">({question.points} points)</span></CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                {question.type === 'MCQ' ? (
                                                     <>
                                                        <div className="space-y-2">
                                                            {question.options.map(option => {
                                                                const isUserChoice = results.submission.answers.some(a => a.questionId === question.id && a.selectedOptionId === option.id);
                                                                const isTheCorrectAnswer = option.isCorrect;
                                                                
                                                                return (
                                                                    <div 
                                                                        key={option.id}
                                                                        className={cn(
                                                                            "flex items-start gap-3 p-3 rounded-lg border text-sm",
                                                                            isUserChoice && isTheCorrectAnswer && "bg-green-500/10 border-green-500/30",
                                                                            !isUserChoice && isTheCorrectAnswer && "border-green-500/50 border-dotted",
                                                                            isUserChoice && !isTheCorrectAnswer && "bg-red-500/10 border-red-500/30"
                                                                        )}
                                                                    >
                                                                        <div className="mt-0.5">
                                                                            {isUserChoice && isTheCorrectAnswer && <Check className="h-5 w-5 text-green-500" />}
                                                                            {isUserChoice && !isTheCorrectAnswer && <X className="h-5 w-5 text-red-500" />}
                                                                            {!isUserChoice && isTheCorrectAnswer && <Target className="h-5 w-5 text-green-500" />}
                                                                            {!isUserChoice && !isTheCorrectAnswer && (question.isMultipleChoice ? <CircleDot className="h-5 w-5 text-muted-foreground" /> : <FileQuestion className="h-5 w-5 text-muted-foreground" />)}
                                                                        </div>
                                                                        <div className="flex-grow">
                                                                            <p className={cn(isUserChoice && !isTheCorrectAnswer && 'line-through')}>{option.text}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {question.images && question.images.length > 0 && (
                                                            <div className="grid grid-cols-2 gap-4">
                                                                {question.images.map(image => (
                                                                    <div key={image.id} className="relative aspect-video">
                                                                        <Image src={image.url} alt={`Question image`} layout="fill" className="object-contain rounded-md" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="p-4 bg-muted/50 rounded-lg">
                                                            <Label className="text-sm font-semibold text-muted-foreground">Submitted Answer:</Label>
                                                            <Textarea 
                                                                readOnly 
                                                                value={userAnswer?.customAnswer || "No answer provided."}
                                                                className="mt-2 bg-background/50 text-base"
                                                            />
                                                        </div>
                                                        {userAnswer?.customAnswer ? (
                                                          <ManualGradeForm submissionId={submissionId} question={question} answer={userAnswer} onGradeSaved={fetchResults} />
                                                        ) : (
                                                            <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg text-sm border border-yellow-500/20">
                                                                <p className="font-semibold text-yellow-300">No answer was submitted for this question.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                        {index < results.submission.exam.questions.length - 1 && <Separator className="my-8" />}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function ExamResultsClient({ exam, initialSubmissions }: { exam: any, initialSubmissions: ExamResultSubmission[] }) {
    const { toast } = useToast();
    const [submissions, setSubmissions] = useState(initialSubmissions);
    const [isRefreshing, startRefreshTransition] = useTransition();
    
    useEffect(() => {
        setSubmissions(initialSubmissions);
    }, [initialSubmissions]);

    const totalPoints = exam.questions.reduce((sum: number, q: any) => sum + q.points, 0);

    const refreshResults = async () => {
        startRefreshTransition(async () => {
            try {
                const { submissions: freshSubmissions } = await getExamResultsForAdmin(exam.id);
                setSubmissions(freshSubmissions);
                toast({ title: 'Results Refreshed' });
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        });
    };

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/exams">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <p className="text-sm text-muted-foreground">Results for</p>
                    <h1 className="font-semibold text-lg md:text-2xl">{exam.title}</h1>
                </div>

                <Button variant="outline" size="icon" onClick={refreshResults} disabled={isRefreshing} className="ml-auto">
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Submissions</CardTitle>
                    <CardDescription>
                        A list of all submissions for this exam.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Percentage</TableHead>
                                <TableHead>Time Taken</TableHead>
                                <TableHead>Attempts</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.length > 0 ? submissions.map(sub => {
                                const percentage = totalPoints > 0 ? (sub.score / totalPoints) * 100 : 0;
                                const timeTaken = sub.timeTakenSeconds ? `${Math.floor(sub.timeTakenSeconds / 60)}m ${sub.timeTakenSeconds % 60}s` : 'N/A';
                                const attemptsAllowed = exam.attemptsAllowed;
                                
                                return (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={sub.user.image || ''} />
                                                <AvatarFallback>{sub.user.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{sub.user.name}</p>
                                                <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{sub.score} / {totalPoints}</TableCell>
                                    <TableCell>
                                        <Badge variant={percentage >= 50 ? 'default' : 'secondary'}>{percentage.toFixed(0)}%</Badge>
                                    </TableCell>
                                    <TableCell>{timeTaken}</TableCell>
                                    <TableCell>{sub.attemptCount} / {attemptsAllowed === 0 ? '∞' : attemptsAllowed}</TableCell>
                                    <TableCell><ClientSideDate date={sub.submittedAt} formatString='MM/dd/yyyy' /></TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <ViewSubmissionDialog submissionId={sub.id} exam={exam} />
                                                <ManageAttemptsDialog submission={sub} onUpdate={refreshResults}/>
                                                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete Submission</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No submissions yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

    
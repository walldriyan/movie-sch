

'use client';

import { useState, useTransition, useEffect } from 'react';
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
import { ArrowLeft, RefreshCw, MoreHorizontal, Eye, Edit, Trash2, Loader2, Check, X, Target, FileQuestion, CircleDot } from 'lucide-react';
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
import { getExamResultsForAdmin, updateSubmissionAttempts, getExamResults } from '@/lib/actions';
import type { ExamResultSubmission } from '@/lib/types';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import ClientSideDate from '@/components/manage/client-side-date';

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

function ViewSubmissionDialog({ submissionId, exam }: { submissionId: number, exam: any }) {
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState<ExamResultsType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen && !results) {
            fetchResults();
        }
    };

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
    }
    
    const calculateQuestionScore = (question: any, submissionData: any) => {
        const userAnswersForQuestion = submissionData.answers
            .filter((a: any) => a.questionId === question.id)
            .map((a: any) => a.selectedOptionId);

        if (userAnswersForQuestion.length === 0) return 0;

        const correctOptionIds = question.options.filter((o: any) => o.isCorrect).map((o: any) => o.id);
        const pointsPerCorrectAnswer = correctOptionIds.length > 0 ? question.points / correctOptionIds.length : 0;
        
        let score = 0;
        if (question.isMultipleChoice) {
            userAnswersForQuestion.forEach((id: number) => {
                if (correctOptionIds.includes(id)) {
                    score += pointsPerCorrectAnswer;
                } else {
                    score -= pointsPerCorrectAnswer; 
                }
            });
        } else {
            // Single choice
            const selectedOptionId = userAnswersForQuestion[0];
            if (correctOptionIds.includes(selectedOptionId)) {
                score = question.points;
            }
        }
        return Math.max(0, Math.round(score));
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
                    <DialogTitle>Submission Details</DialogTitle>
                    <DialogDescription>
                        Reviewing answers for {results?.user.name} on the exam &quot;{exam.title}&quot;.
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
                             <div className="space-y-6 py-4">
                                {results.submission.exam.questions.map((question, index) => {
                                    const userAnswersIds = results.submission.answers
                                        .filter(a => a.questionId === question.id)
                                        .map(a => a.selectedOptionId);
                                        
                                    const correctOptionIds = question.options
                                        .filter(o => o.isCorrect)
                                        .map(o => o.id);
                                    
                                    const awardedPoints = calculateQuestionScore(question, results.submission);
                                    
                                    const pointsPerCorrectAnswer = correctOptionIds.length > 0 ? question.points / correctOptionIds.length : 0;
                                    const pointsToDeductPerWrong = correctOptionIds.length > 0 ? question.points / correctOptionIds.length : 0;


                                    return (
                                        <div key={question.id}>
                                            <div className="font-semibold">{index + 1}. {question.text}</div>
                                            <p className="text-sm text-muted-foreground mb-4">{question.points} points</p>
                                            
                                            <div className="space-y-2">
                                                {question.options.map(option => {
                                                    const isUserChoice = userAnswersIds.includes(option.id);
                                                    const isTheCorrectAnswer = correctOptionIds.includes(option.id);
                                                    
                                                    return (
                                                        <div 
                                                            key={option.id}
                                                            className={cn(
                                                                "flex items-start gap-3 p-3 rounded-lg border text-sm",
                                                                isUserChoice && isTheCorrectAnswer && "bg-green-500/10 border-green-500/30", // Correct & Selected
                                                                !isUserChoice && isTheCorrectAnswer && "border-green-500/50 border-dotted", // Correct & Not Selected
                                                                isUserChoice && !isTheCorrectAnswer && "bg-red-500/10 border-red-500/30" // Incorrect & Selected
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
                                                                 
                                                                {isUserChoice && isTheCorrectAnswer && (
                                                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
                                                                        නිවැරදි පිළිතුර (ඔබ තේරූ)
                                                                        <span className="font-bold ml-2 text-green-500">(+{pointsPerCorrectAnswer.toFixed(1)} ලකුණු)</span>
                                                                    </p>
                                                                )}
                                                                {isUserChoice && !isTheCorrectAnswer && (
                                                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
                                                                        වැරදි පිළිතුර (ඔබ තේරූ)
                                                                        <span className="font-bold ml-2 text-red-500">(-{pointsToDeductPerWrong.toFixed(1)} ලකුණු)</span>
                                                                    </p>
                                                                )}
                                                                {!isUserChoice && isTheCorrectAnswer && (
                                                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">නිවැරදි පිළිතුර (ඔබ නොතේරූ)</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                                                <p className="font-semibold">ලකුණු: <span className="font-bold text-primary">{awardedPoints}</span> / {question.points}</p>
                                            </div>
                                            {index < results.submission.exam.questions.length - 1 && <Separator className="mt-6" />}
                                        </div>
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

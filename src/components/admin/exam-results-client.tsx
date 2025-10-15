'use client';

import { useState, useTransition } from 'react';
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
import { ArrowLeft, RefreshCw, MoreHorizontal, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
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
import { getExamResultsForAdmin, updateSubmissionAttempts } from '@/lib/actions';
import type { ExamResultSubmission } from '@/lib/types';


function ManageAttemptsDialog({ submission, onUpdate }: { submission: ExamResultSubmission, onUpdate: () => void }) {
    const [open, setOpen] = useState(false);
    const [attempts, setAttempts] = useState(submission.attempts);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateSubmissionAttempts(submission.id, attempts);
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
                        Set the number of times this user can attempt the exam. Use 0 for unlimited.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="attempts">Allowed Attempts</Label>
                    <Input 
                        id="attempts"
                        type="number"
                        value={attempts}
                        onChange={(e) => setAttempts(Number(e.target.value))}
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
                                    <TableCell>{sub.attempts} / {exam.attemptsAllowed === 0 ? '∞' : exam.attemptsAllowed}</TableCell>
                                    <TableCell>{new Date(sub.submittedAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/exams/${exam.id}/results?submissionId=${sub.id}`} target="_blank">
                                                        <Eye className="mr-2 h-4 w-4"/>View Submission
                                                    </Link>
                                                </DropdownMenuItem>
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

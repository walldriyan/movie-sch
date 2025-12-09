'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, Clock, ArrowLeft, Trophy, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ResultViewerProps {
    submission: any;
    user: any;
}

export default function ResultViewer({ submission, user }: ResultViewerProps) {
    const router = useRouter();
    const { exam, answers, score, timeTakenSeconds } = submission;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const totalPoints = exam.questions.reduce((acc: number, q: any) => acc + (q.points || 0), 0);
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{exam.title}</h1>
                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Calendar className="w-3.5 h-3.5" />
                            Submitted {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>

                {/* Score Card */}
                <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className={cn(
                                "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 shadow-xl",
                                percentage >= 75 ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" :
                                    percentage >= 50 ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" :
                                        "bg-red-500/20 border-red-500 text-red-500"
                            )}>
                                {percentage}%
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-semibold">
                                    {percentage >= 75 ? "Excellent Job!" : percentage >= 50 ? "Good Effort" : "Keep Practicing"}
                                </h2>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1"><Trophy className="w-4 h-4" /> Score: {score} / {totalPoints}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatTime(timeTakenSeconds)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button asChild variant="outline" className="border-white/10 hover:bg-white/5">
                                <a href={`/exams/${exam.id}`}>Retake Exam</a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions Review */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold px-1">Review Answers</h3>
                    {exam.questions.map((question: any, index: number) => {
                        const userAnswer = answers.find((a: any) => a.questionId === question.id);

                        let isCorrect = false;
                        const isMCQ = question.type === 'MCQ';

                        if (isMCQ) {
                            isCorrect = userAnswer?.selectedOption?.isCorrect;
                        } else {
                            // For manual grading, consider correct if full marks or partially correct if some marks
                            // Ideally show 'Partially Correct' or points
                            isCorrect = (userAnswer?.marksAwarded > 0);
                        }

                        // Handle pending grading state
                        const isPending = !isMCQ && userAnswer?.marksAwarded === null;

                        return (
                            <Card key={question.id} className={cn(
                                "border-l-4 transition-all",
                                isPending ? "border-l-yellow-500 bg-yellow-500/5 border-y-white/5 border-r-white/5" :
                                    isCorrect ? "border-l-emerald-500 bg-emerald-500/5 border-y-white/5 border-r-white/5" :
                                        "border-l-red-500 bg-red-500/5 border-y-white/5 border-r-white/5"
                            )}>
                                <CardHeader className="py-4">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center font-bold text-sm shrink-0">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="text-base font-medium leading-relaxed">{question.text}</CardTitle>
                                            {!isMCQ && (
                                                <div className="mt-2 text-sm text-muted-foreground p-3 bg-black/20 rounded-md">
                                                    <p className='text-xs uppercase tracking-wider mb-1 opacity-70'>Your Answer:</p>
                                                    <p className='text-foreground'>{userAnswer?.customAnswer || 'No answer'}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                            {isPending ? (
                                                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20">
                                                    Pending
                                                </Badge>
                                            ) : isCorrect ? (
                                                <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Correct
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-500/20 text-red-500 border-red-500/20 hover:bg-red-500/20">
                                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Incorrect
                                                </Badge>
                                            )}

                                            {!isMCQ && !isPending && (
                                                <Badge variant="outline" className="border-white/10">
                                                    Score: {userAnswer?.marksAwarded} / {question.points}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-4 pl-16">
                                    {isMCQ && (
                                        <div className="grid gap-2">
                                            {question.options.map((option: any) => {
                                                const isSelected = userAnswer?.selectedOptionId === option.id;
                                                const isOptionCorrect = option.isCorrect;

                                                return (
                                                    <div
                                                        key={option.id}
                                                        className={cn(
                                                            "p-3 rounded-lg text-sm border flex justify-between items-center transition-colors",
                                                            isOptionCorrect ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-200" :
                                                                isSelected ? "bg-red-500/20 border-red-500/30 text-red-200" :
                                                                    "bg-white/5 border-white/5 text-muted-foreground"
                                                        )}
                                                    >
                                                        <span>{option.text}</span>
                                                        {isOptionCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                        {isSelected && !isOptionCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

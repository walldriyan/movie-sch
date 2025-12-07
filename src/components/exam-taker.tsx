
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { AlertCircle, Timer, Send, PlayCircle, Clock, Loader2, Check, Eye, RotateCcw, Download, X, Target, FileQuestion, Film, User, Calendar, Pencil } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { submitExam, getExamResults } from '@/lib/actions';
import type { getExamForTaker } from '@/lib/actions';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

type Exam = NonNullable<Awaited<ReturnType<typeof getExamForTaker>>>;

export default function ExamTaker({ exam }: { exam: Exam }) {
    const router = useRouter();
    const [hasStarted, setHasStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(exam.durationMinutes ? exam.durationMinutes * 60 : Infinity);
    const [timeTaken, setTimeTaken] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedId, setSubmittedId] = useState<number | null>(null);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [examResults, setExamResults] = useState<any>(null);
    const [loadingResults, setLoadingResults] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);

    // Memoized format time function
    const formatTime = useCallback((seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }, []);

    // Memoized submit handler
    const handleFormSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        const formData = new FormData(event.currentTarget);

        const answers: Record<string, string | string[]> = {};
        formData.forEach((value, key) => {
            if (key.startsWith('question-')) {
                const existing = answers[key];
                if (existing) {
                    if (Array.isArray(existing)) {
                        existing.push(value as string);
                    } else {
                        answers[key] = [existing, value as string];
                    }
                } else {
                    answers[key] = value as string;
                }
            }
        });


        const payload = {
            answers,
            timeTakenSeconds: timeTaken,
        };

        try {
            const newSubmission = await submitExam(exam.id, payload);
            if (newSubmission) {
                setSubmittedId(newSubmission.id);
                setIsSubmitting(false);
                // Fetch results for modal
                setLoadingResults(true);
                try {
                    const results = await getExamResults(newSubmission.id);
                    setExamResults(results);
                } catch (e) {
                    console.error('Failed to fetch results:', e);
                }
                setLoadingResults(false);
            } else {
                throw new Error("Submission failed to return a result.");
            }
        } catch (error) {
            console.error("--- [Client] Submission Error ---", error);
            setIsSubmitting(false);
            alert("There was an error submitting your exam. Please try again.");
        }
    }, [exam.id, timeTaken, isSubmitting]);

    useEffect(() => {
        // Stop timer if not started, no duration, submitting, or already submitted
        if (!hasStarted || !exam.durationMinutes || isSubmitting || submittedId) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeTaken(prev => prev + 1);
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    // Auto-submit using form ref
                    if (formRef.current && !isSubmitting) {
                        setIsSubmitting(true);
                        formRef.current.requestSubmit();
                    }
                    return 0;
                }
                if (prevTime <= 61 && !showWarning) {
                    setShowWarning(true);
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [hasStarted, exam.durationMinutes, showWarning, isSubmitting, submittedId]);

    const handleStart = useCallback(() => {
        setTimeTaken(0);
        setHasStarted(true);
    }, []);


    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 pt-28 flex items-center justify-center">
                <Card className="max-w-2xl w-full">
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
                    </CardHeader>
                    <CardContent>
                        {exam.description && <p className="pt-2 text-muted-foreground">{exam.description}</p>}
                        <Alert className="mt-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Instructions</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc pl-5 space-y-1 mt-2">
                                    <li>Once you start, a timer will begin.</li>
                                    <li>The exam will be submitted automatically when the time runs out.</li>
                                    <li>Ensure you have a stable internet connection.</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Button size="lg" onClick={handleStart}>
                            <PlayCircle className="mr-2 h-5 w-5" />
                            Start Exam
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 pt-28">
            {exam.durationMinutes && (
                <div className={`fixed bottom-4 left-4 z-50 text-2xl font-mono font-semibold p-2 rounded-lg flex items-center gap-2 ${showWarning ? 'bg-destructive/20 text-destructive' : 'bg-muted'}`}>
                    <Clock className="h-6 w-6" />
                    <span>{formatTime(timeLeft)}</span>
                </div>
            )}
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-3xl font-bold font-serif">{exam.title}</CardTitle>
                                <CardDescription className="pt-2">{exam.questions.length} questions</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <form ref={formRef} onSubmit={handleFormSubmit}>
                        <CardContent className="space-y-8">
                            {exam.questions.map((question, qIndex) => (
                                <div key={question.id}>
                                    <Separator className={qIndex > 0 ? 'mb-8' : ''} />
                                    <div className="font-semibold text-lg">{qIndex + 1}. {question.text}</div>
                                    <p className="text-sm text-muted-foreground mb-4">{question.points} points</p>

                                    {question.type === 'IMAGE_BASED_ANSWER' && question.images && (
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            {question.images.map(image => (
                                                <div key={image.id} className="relative aspect-video">
                                                    <Image src={image.url} alt={`Question ${qIndex + 1} image`} layout="fill" className="object-contain rounded-md" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {question.type === 'MCQ' ? (
                                        question.isMultipleChoice ? (
                                            <div className="space-y-2">
                                                {question.options.map(option => (
                                                    <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg border-2 border-white/15 hover:border-white/25 has-[:checked]:border-white/50 has-[:checked]:bg-white/5 transition-all duration-200">
                                                        <Checkbox
                                                            id={`option-${option.id}`}
                                                            name={`question-${question.id}`}
                                                            value={String(option.id)}
                                                        />
                                                        <Label htmlFor={`option-${option.id}`} className="flex-grow cursor-pointer">{option.text}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <RadioGroup name={`question-${question.id}`} required className="space-y-2">
                                                {question.options.map(option => (
                                                    <div key={option.id} className="flex items-center space-x-3 p-3 rounded-lg border-2 border-white/15 hover:border-white/25 has-[:checked]:border-white/50 has-[:checked]:bg-white/5 transition-all duration-200">
                                                        <RadioGroupItem value={String(option.id)} id={`option-${option.id}`} />
                                                        <Label htmlFor={`option-${option.id}`} className="flex-grow cursor-pointer">{option.text}</Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        )
                                    ) : (
                                        <Textarea
                                            name={`question-${question.id}`}
                                            placeholder="Type your answer here..."
                                            rows={5}
                                        />
                                    )}
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-3">
                            {submittedId ? (
                                <>
                                    <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
                                        <DialogTrigger asChild>
                                            <Button size="lg" variant="default">
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Results
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col">
                                            <DialogHeader>
                                                <DialogTitle>Exam Results</DialogTitle>
                                                <DialogDescription>Your submission results</DialogDescription>
                                            </DialogHeader>
                                            <ScrollArea className="flex-1">
                                                {loadingResults ? (
                                                    <div className="flex items-center justify-center h-64">
                                                        <Loader2 className="h-8 w-8 animate-spin" />
                                                    </div>
                                                ) : examResults ? (() => {
                                                    const totalPoints = examResults.submission.exam.questions.reduce((s: number, q: any) => s + q.points, 0);
                                                    const percentage = totalPoints > 0 ? (examResults.submission.score / totalPoints) * 100 : 0;
                                                    const correctCount = examResults.submission.answers.filter((a: any) => {
                                                        const q = examResults.submission.exam.questions.find((q: any) => q.id === a.questionId);
                                                        const opt = q?.options.find((o: any) => o.id === a.selectedOptionId);
                                                        return opt?.isCorrect;
                                                    }).length;
                                                    const wrongCount = examResults.submission.exam.questions.length - correctCount;

                                                    return (
                                                        <div className="p-4 space-y-6">
                                                            {/* Score Summary Cards */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                <div className="text-center p-4 bg-muted rounded-lg">
                                                                    <p className="text-3xl font-bold">{examResults.submission.score}/{totalPoints}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">Total Score</p>
                                                                </div>
                                                                <div className="text-center p-4 bg-muted rounded-lg">
                                                                    <p className="text-3xl font-bold">{percentage.toFixed(0)}%</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">Percentage</p>
                                                                </div>
                                                                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                                                                    <p className="text-3xl font-bold text-green-500">{correctCount}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">Correct</p>
                                                                </div>
                                                                <div className="text-center p-4 bg-red-500/10 rounded-lg">
                                                                    <p className="text-3xl font-bold text-red-500">{wrongCount}</p>
                                                                    <p className="text-xs text-muted-foreground mt-1">Wrong</p>
                                                                </div>
                                                            </div>

                                                            {/* Pass/Fail Status */}
                                                            <div className={cn(
                                                                "text-center p-4 rounded-lg border-2",
                                                                percentage >= 50 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
                                                            )}>
                                                                <p className={cn("text-2xl font-bold", percentage >= 50 ? "text-green-500" : "text-red-500")}>
                                                                    {percentage >= 50 ? "🎉 PASSED!" : "❌ FAILED"}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {percentage >= 50 ? "Congratulations!" : "Better luck next time!"}
                                                                </p>
                                                            </div>

                                                            {/* Question Review */}
                                                            <div className="space-y-4">
                                                                <h3 className="font-semibold text-lg border-b pb-2">Answer Review</h3>
                                                                {examResults.submission.exam.questions.map((q: any, i: number) => {
                                                                    const userAnswers = examResults.submission.answers.filter((a: any) => a.questionId === q.id);

                                                                    return (
                                                                        <div key={q.id} className="p-4 border rounded-lg">
                                                                            <p className="font-medium">Q{i + 1}. {q.text}</p>
                                                                            <p className="text-sm text-muted-foreground mb-3">({q.points} points)</p>

                                                                            {q.type === 'MCQ' ? (
                                                                                <div className="space-y-2">
                                                                                    {q.options.map((opt: any) => {
                                                                                        const isUserChoice = userAnswers.some((a: any) => a.selectedOptionId === opt.id);
                                                                                        const isCorrect = opt.isCorrect;

                                                                                        return (
                                                                                            <div
                                                                                                key={opt.id}
                                                                                                className={cn(
                                                                                                    "flex items-center gap-2 p-2 rounded-md text-sm border",
                                                                                                    isCorrect && "bg-green-500/10 border-green-500/30",
                                                                                                    isUserChoice && !isCorrect && "bg-red-500/10 border-red-500/30"
                                                                                                )}
                                                                                            >
                                                                                                <div className="flex-shrink-0">
                                                                                                    {isUserChoice && isCorrect && <Check className="h-4 w-4 text-green-500" />}
                                                                                                    {isUserChoice && !isCorrect && <X className="h-4 w-4 text-red-500" />}
                                                                                                    {!isUserChoice && isCorrect && <Target className="h-4 w-4 text-green-500" />}
                                                                                                    {!isUserChoice && !isCorrect && <FileQuestion className="h-4 w-4 text-muted-foreground" />}
                                                                                                </div>
                                                                                                <p className={cn(
                                                                                                    isCorrect && "font-semibold",
                                                                                                    isUserChoice && !isCorrect && "line-through"
                                                                                                )}>{opt.text}</p>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="space-y-2">
                                                                                    <div className="p-3 rounded-md bg-muted">
                                                                                        <p className="text-xs font-semibold text-muted-foreground mb-1">Your Answer:</p>
                                                                                        <p className="text-sm whitespace-pre-wrap">{userAnswers[0]?.customAnswer || 'No answer provided.'}</p>
                                                                                    </div>
                                                                                    {userAnswers[0]?.marksAwarded !== null && userAnswers[0]?.marksAwarded !== undefined ? (
                                                                                        <div className="p-2 bg-green-500/10 border-green-500/30 rounded-lg text-sm border">
                                                                                            <p className="font-semibold text-green-500 flex items-center gap-2">
                                                                                                <Check className="h-4 w-4" />
                                                                                                Graded: {userAnswers[0].marksAwarded} / {q.points} points
                                                                                            </p>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="p-2 bg-blue-500/10 border-blue-500/30 rounded-lg text-sm border">
                                                                                            <p className="font-semibold text-blue-500 flex items-center gap-2">
                                                                                                <Pencil className="h-4 w-4" />Pending Review
                                                                                            </p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })() : (
                                                    <p className="text-center p-8">Could not load results</p>
                                                )}
                                            </ScrollArea>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setShowResultsModal(false)}>Close</Button>
                                                <Button onClick={() => window.print()}>
                                                    <Download className="mr-2 h-4 w-4" /> Download PDF
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="outline" size="lg" onClick={() => {
                                        setSubmittedId(null);
                                        setHasStarted(false);
                                        setTimeTaken(0);
                                        setTimeLeft(exam.durationMinutes ? exam.durationMinutes * 60 : Infinity);
                                    }}>
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Try Again
                                    </Button>
                                </>
                            ) : (
                                <Button type="submit" size="lg" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Submit Exam
                                        </>
                                    )}
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

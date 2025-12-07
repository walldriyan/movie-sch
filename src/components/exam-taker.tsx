
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
import { AlertCircle, Timer, Send, PlayCircle, Clock, Loader2, Check, Eye, RotateCcw, Download, X, Target, FileQuestion, Film, User, Calendar, Pencil, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const [currentQuestion, setCurrentQuestion] = useState(0); // Stepper state
    const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set()); // Track answered questions
    const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({}); // Controlled state for answers
    const [showCompletionScreen, setShowCompletionScreen] = useState(false); // Show finish screen

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);



    // Memoized format time function
    const formatTime = useCallback((seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }, []);

    // Handle answer changes - Controlled
    const handleAnswerChange = useCallback((questionId: number, value: string | string[]) => {
        setUserAnswers(prev => {
            const key = `question-${questionId}`;
            return { ...prev, [key]: value };
        });

        // Mark as answered if value is not empty
        setAnsweredQuestions(prev => {
            const next = new Set(prev);
            const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
            if (isEmpty) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            return next;
        });
    }, []);

    // Memoized submit handler
    const handleFormSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        // Use controlled state 'userAnswers' instead of FormData
        const payload = {
            answers: userAnswers,
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



    // Check if all questions are answered
    const allQuestionsAnswered = answeredQuestions.size >= exam.questions.length;

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
            {/* Timer - only show when exam is in progress, hide after submission */}
            {exam.durationMinutes && !submittedId && (
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
                        <CardContent className="space-y-6">
                            {/* Stepper Progress Bar - Hidden when submitted */}
                            {!submittedId && (
                                <>
                                    <div className="flex items-center gap-1.5 mb-4">
                                        {exam.questions.map((q, idx) => {
                                            const isAnswered = answeredQuestions.has(q.id);
                                            const isCurrent = idx === currentQuestion;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => !showCompletionScreen && setCurrentQuestion(idx)}
                                                    className={cn(
                                                        "flex-1 h-3 rounded-full transition-all relative group",
                                                        isCurrent ? "bg-primary ring-2 ring-primary/30" :
                                                            isAnswered ? "bg-green-500" : "bg-muted hover:bg-muted-foreground/30"
                                                    )}
                                                    title={`Question ${idx + 1}${isAnswered ? ' ✓' : ''}`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Question {currentQuestion + 1} of {exam.questions.length}</span>
                                        <span className="text-green-500">{answeredQuestions.size}/{exam.questions.length} answered</span>
                                    </div>
                                </>
                            )}

                            {/* Current Question Display - Hidden when submitted */}
                            {!submittedId && !showCompletionScreen && (() => {
                                const question = exam.questions[currentQuestion];
                                if (!question) return null;

                                return (
                                    <div className="min-h-[300px]">
                                        <div className="font-semibold text-xl mb-2">Q{currentQuestion + 1}. {question.text}</div>
                                        <p className="text-sm text-muted-foreground mb-6">{question.points} points</p>

                                        {question.type === 'IMAGE_BASED_ANSWER' && question.images && (
                                            <div className="mb-4 grid grid-cols-2 gap-4">
                                                {question.images.map(image => (
                                                    <div key={image.id} className="relative aspect-video">
                                                        <Image src={image.url} alt={`Question ${currentQuestion + 1} image`} layout="fill" className="object-contain rounded-md" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {question.type === 'MCQ' ? (
                                            question.isMultipleChoice ? (
                                                <div className="space-y-3">
                                                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">Multiple Choice</span>
                                                        Select all correct answers
                                                    </p>
                                                    {question.options.map(option => {
                                                        const optId = String(option.id);
                                                        const currentAnswers = userAnswers[`question-${question.id}`];
                                                        const isChecked = Array.isArray(currentAnswers)
                                                            ? currentAnswers.includes(optId)
                                                            : currentAnswers === optId; // Fallback if single string somehow

                                                        return (
                                                            <div key={option.id} className="flex items-center space-x-3 p-4 rounded-xl border-2 border-white/10 hover:border-white/20 has-[:checked]:border-primary has-[:checked]:bg-gradient-to-r has-[:checked]:from-primary/10 has-[:checked]:to-primary/5 transition-all duration-300 cursor-pointer">
                                                                <Checkbox
                                                                    id={`option-${option.id}`}
                                                                    name={`question-${question.id}`}
                                                                    value={optId}
                                                                    checked={isChecked}
                                                                    onCheckedChange={(checked) => {
                                                                        const current = userAnswers[`question-${question.id}`] || [];
                                                                        let newAnswers = Array.isArray(current) ? [...current] : [current as string];

                                                                        if (checked) {
                                                                            if (!newAnswers.includes(optId)) newAnswers.push(optId);
                                                                        } else {
                                                                            newAnswers = newAnswers.filter(id => id !== optId);
                                                                        }
                                                                        handleAnswerChange(question.id, newAnswers);
                                                                    }}
                                                                />
                                                                <Label htmlFor={`option-${option.id}`} className="flex-grow cursor-pointer text-base">{option.text}</Label>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <RadioGroup
                                                    name={`question-${question.id}`}
                                                    value={userAnswers[`question-${question.id}`] as string || ""}
                                                    onValueChange={(val) => handleAnswerChange(question.id, val)}
                                                    className="space-y-3"
                                                >
                                                    {question.options.map(option => (
                                                        <div key={option.id} className="flex items-center space-x-3 p-4 rounded-xl border-2 border-white/10 hover:border-white/20 has-[:checked]:border-primary has-[:checked]:bg-gradient-to-r has-[:checked]:from-primary/10 has-[:checked]:to-primary/5 transition-all duration-300 cursor-pointer">
                                                            <RadioGroupItem value={String(option.id)} id={`option-${option.id}`} />
                                                            <Label htmlFor={`option-${option.id}`} className="flex-grow cursor-pointer text-base">{option.text}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            )
                                        ) : (
                                            <Textarea
                                                name={`question-${question.id}`}
                                                placeholder="Type your answer here..."
                                                rows={6}
                                                className="text-base"
                                                value={userAnswers[`question-${question.id}`] as string || ""}
                                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                            />
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Navigation Buttons - Hidden when submitted */}
                            {!submittedId && !showCompletionScreen && (
                                <div className="flex justify-between items-center pt-6 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="lg"
                                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                                        disabled={currentQuestion === 0}
                                        className="px-6"
                                    >
                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                        Previous
                                    </Button>

                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-semibold">{currentQuestion + 1} / {exam.questions.length}</span>
                                        <span className="text-xs text-muted-foreground">{answeredQuestions.size} answered</span>
                                    </div>

                                    {currentQuestion < exam.questions.length - 1 ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="lg"
                                            onClick={() => setCurrentQuestion(prev => Math.min(exam.questions.length - 1, prev + 1))}
                                            className="px-6"
                                        >
                                            Next
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            size="lg"
                                            onClick={() => setShowCompletionScreen(true)}
                                            className="px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                        >
                                            Finish
                                            <Check className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Completion Screen */}
                            {showCompletionScreen && !submittedId && (
                                <div className="mt-6 p-6 bg-gradient-to-br from-primary/10 via-background to-green-500/10 rounded-2xl border border-primary/20 text-center space-y-6">
                                    <div className="text-6xl">🎯</div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-2">Ready to Submit?</h3>
                                        <p className="text-muted-foreground mb-4">
                                            You have answered <span className="font-bold text-green-500">{answeredQuestions.size}</span> out of <span className="font-bold">{exam.questions.length}</span> questions.
                                        </p>
                                        {!allQuestionsAnswered && (
                                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4 text-sm text-yellow-500">
                                                ⚠️ You haven't answered all questions. Unanswered questions will be marked as wrong.
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="lg"
                                            onClick={() => setShowCompletionScreen(false)}
                                            className="px-8"
                                        >
                                            <ChevronLeft className="mr-2 h-4 w-4" />
                                            Review Answers
                                        </Button>
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={isSubmitting}
                                            className="px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                                        >
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
                                    </div>
                                </div>
                            )}

                            {/* Submitted Success Screen */}
                            {submittedId && (
                                <div className="mt-6 p-8 bg-gradient-to-br from-green-500/20 via-background to-emerald-500/10 rounded-2xl border border-green-500/30 text-center space-y-6">
                                    <div className="text-7xl">🎉</div>
                                    <div>
                                        <h3 className="text-3xl font-bold mb-2 text-green-500">Exam Submitted!</h3>
                                        <p className="text-muted-foreground">
                                            Your answers have been recorded successfully.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="lg"
                                                    className="px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                                                >
                                                    <Eye className="mr-2 h-5 w-5" />
                                                    View Results
                                                </Button>
                                            </DialogTrigger>
                                        </Dialog>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="lg"
                                            onClick={() => {
                                                setSubmittedId(null);
                                                setHasStarted(false);
                                                setTimeTaken(0);
                                                setTimeLeft(exam.durationMinutes ? exam.durationMinutes * 60 : Infinity);
                                                setAnsweredQuestions(new Set());
                                                setShowCompletionScreen(false);
                                                setCurrentQuestion(0);
                                            }}
                                            className="px-8"
                                        >
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Try Again
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        {/* Hidden CardFooter - Dialog only, no visible buttons */}
                        <CardFooter className="hidden">
                            {submittedId && (
                                <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
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
                                                                <p className="text-xs text-muted-foreground mt-1">Total Score / මුළු ලකුණු</p>
                                                            </div>
                                                            <div className="text-center p-4 bg-muted rounded-lg">
                                                                <p className="text-3xl font-bold">{percentage.toFixed(0)}%</p>
                                                                <p className="text-xs text-muted-foreground mt-1">Percentage / ප්‍රතිශතය</p>
                                                            </div>
                                                            <div className="text-center p-4 bg-green-500/10 rounded-lg">
                                                                <p className="text-3xl font-bold text-green-500">{correctCount}</p>
                                                                <p className="text-xs text-muted-foreground mt-1">Correct / නිවැරදි</p>
                                                            </div>
                                                            <div className="text-center p-4 bg-red-500/10 rounded-lg">
                                                                <p className="text-3xl font-bold text-red-500">{wrongCount}</p>
                                                                <p className="text-xs text-muted-foreground mt-1">Wrong / වැරදි</p>
                                                            </div>
                                                        </div>

                                                        {/* Pass/Fail Status */}
                                                        <div className={cn(
                                                            "text-center p-4 rounded-lg border-2",
                                                            percentage >= 50 ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"
                                                        )}>
                                                            <p className={cn("text-2xl font-bold", percentage >= 50 ? "text-green-500" : "text-red-500")}>
                                                                {percentage >= 50 ? "🎉 PASSED! / සමත්!" : "❌ FAILED / අසමත්"}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {percentage >= 50 ? "Congratulations! You passed this exam. / සුභ පැතුම්!" : "Better luck next time! / ඊළඟ වතාවේ හොඳින්!"}
                                                            </p>
                                                        </div>

                                                        {/* Question Review */}
                                                        <div className="space-y-4">
                                                            <h3 className="font-semibold text-lg border-b pb-2">📝 Answer Review / පිළිතුරු සමාලෝචනය</h3>
                                                            {examResults.submission.exam.questions.map((q: any, i: number) => {
                                                                const userAnswers = examResults.submission.answers.filter((a: any) => a.questionId === q.id);
                                                                const correctOptions = q.options?.filter((o: any) => o.isCorrect) || [];
                                                                const totalCorrectCount = correctOptions.length;

                                                                // Calculate user's correct and wrong selections
                                                                const userCorrectSelections = userAnswers.filter((a: any) =>
                                                                    q.options?.find((o: any) => o.id === a.selectedOptionId)?.isCorrect
                                                                ).length;
                                                                const userWrongSelections = userAnswers.filter((a: any) =>
                                                                    !q.options?.find((o: any) => o.id === a.selectedOptionId)?.isCorrect
                                                                ).length;
                                                                const missedCorrect = totalCorrectCount - userCorrectSelections;

                                                                // Calculate marks
                                                                const marksPerCorrect = totalCorrectCount > 0 ? q.points / totalCorrectCount : q.points;
                                                                const earnedMarks = Math.round(userCorrectSelections * marksPerCorrect);
                                                                const lostMarks = q.points - earnedMarks;
                                                                const isFullMarks = earnedMarks === q.points;
                                                                const isPartial = earnedMarks > 0 && earnedMarks < q.points;
                                                                const isZero = earnedMarks === 0;

                                                                return (
                                                                    <div key={q.id} className="p-4 border rounded-lg space-y-3">
                                                                        {/* Question Header */}
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="flex-1">
                                                                                <p className="font-medium">Q{i + 1}. {q.text}</p>
                                                                                <p className="text-xs text-muted-foreground">Max Marks: {q.points} | ලකුණු: {q.points}</p>
                                                                            </div>
                                                                            {/* Quick Status Badge */}
                                                                            <div className={cn(
                                                                                "px-3 py-1 rounded-full text-xs font-bold",
                                                                                isFullMarks && "bg-green-500/20 text-green-500",
                                                                                isPartial && "bg-yellow-500/20 text-yellow-500",
                                                                                isZero && "bg-red-500/20 text-red-500"
                                                                            )}>
                                                                                {earnedMarks}/{q.points}
                                                                            </div>
                                                                        </div>

                                                                        {q.type === 'MCQ' ? (
                                                                            <>
                                                                                {/* Options Display */}
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
                                                                                                <div className="flex-1">
                                                                                                    <p className={cn(
                                                                                                        isCorrect && "font-semibold",
                                                                                                        isUserChoice && !isCorrect && "line-through"
                                                                                                    )}>{opt.text}</p>
                                                                                                    {/* Sinhala explanations */}
                                                                                                    {isUserChoice && isCorrect && (
                                                                                                        <p className="text-xs text-green-500 mt-0.5">✓ ඔබ තෝරපු පිළිතුර - නිවැරදියි!</p>
                                                                                                    )}
                                                                                                    {isUserChoice && !isCorrect && (
                                                                                                        <p className="text-xs text-red-500 mt-0.5">✗ ඔබ තෝරපු පිළිතුර - වැරදියි!</p>
                                                                                                    )}
                                                                                                    {!isUserChoice && isCorrect && (
                                                                                                        <p className="text-xs text-yellow-500 mt-0.5">🎯 මෙයයි නිවැරදි පිළිතුර</p>
                                                                                                    )}
                                                                                                </div>
                                                                                                {/* Mark indicators */}
                                                                                                {isUserChoice && isCorrect && (
                                                                                                    <span className="text-xs bg-green-500/20 text-green-500 font-bold px-2 py-1 rounded-full">+{marksPerCorrect.toFixed(1)}</span>
                                                                                                )}
                                                                                                {isUserChoice && !isCorrect && (
                                                                                                    <span className="text-xs bg-red-500/20 text-red-500 font-bold px-2 py-1 rounded-full">Wrong</span>
                                                                                                )}
                                                                                                {!isUserChoice && isCorrect && (
                                                                                                    <span className="text-xs bg-yellow-500/20 text-yellow-500 font-bold px-2 py-1 rounded-full">Missed</span>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>

                                                                                {/* Detailed Marks Breakdown */}
                                                                                <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                                                                                    <p className="font-semibold border-b pb-1">📊 Marks Breakdown / ලකුණු විස්තරය:</p>
                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Check className="h-3 w-3 text-green-500" />
                                                                                            <span>Correct: {userCorrectSelections}/{totalCorrectCount}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <X className="h-3 w-3 text-red-500" />
                                                                                            <span>Wrong: {userWrongSelections}</span>
                                                                                        </div>
                                                                                        {missedCorrect > 0 && (
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Target className="h-3 w-3 text-yellow-500" />
                                                                                                <span>Missed: {missedCorrect}</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="border-t pt-2 mt-2">
                                                                                        <div className="flex justify-between">
                                                                                            <span className="text-green-500">✓ Earned / ලැබූ:</span>
                                                                                            <span className="font-bold text-green-500">+{earnedMarks}</span>
                                                                                        </div>
                                                                                        {lostMarks > 0 && (
                                                                                            <div className="flex justify-between">
                                                                                                <span className="text-red-500">✗ Lost / අහිමි:</span>
                                                                                                <span className="font-bold text-red-500">-{lostMarks}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="flex justify-between border-t pt-1 mt-1">
                                                                                            <span className="font-semibold">Final / අවසාන:</span>
                                                                                            <span className={cn(
                                                                                                "font-bold",
                                                                                                isFullMarks && "text-green-500",
                                                                                                isPartial && "text-yellow-500",
                                                                                                isZero && "text-red-500"
                                                                                            )}>{earnedMarks}/{q.points}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            /* Essay Answer */
                                                                            <div className="space-y-2">
                                                                                <div className="p-3 rounded-md bg-muted">
                                                                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Your Answer / ඔබේ පිළිතුර:</p>
                                                                                    <p className="text-sm whitespace-pre-wrap">{userAnswers[0]?.customAnswer || 'No answer provided.'}</p>
                                                                                </div>
                                                                                {userAnswers[0]?.marksAwarded !== null && userAnswers[0]?.marksAwarded !== undefined ? (
                                                                                    <div className="p-3 bg-green-500/10 border-green-500/30 rounded-lg border">
                                                                                        <p className="font-semibold text-green-500 flex items-center gap-2">
                                                                                            <Check className="h-4 w-4" />
                                                                                            Graded: {userAnswers[0].marksAwarded} / {q.points}
                                                                                        </p>
                                                                                        {userAnswers[0].feedback && (
                                                                                            <p className="text-sm text-muted-foreground mt-1">💬 {userAnswers[0].feedback}</p>
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="p-3 bg-blue-500/10 border-blue-500/30 rounded-lg border">
                                                                                        <p className="font-semibold text-blue-500 flex items-center gap-2">
                                                                                            <Pencil className="h-4 w-4" />
                                                                                            ⏳ Pending Review / සමාලෝචනය බලාපොරොත්තුවෙන්
                                                                                        </p>
                                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                                            This answer will be graded manually.
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
                                                <p className="text-center p-8">ප්‍රතිඵල පූරණය කළ නොහැක</p>
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
                            )}
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

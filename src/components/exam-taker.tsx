
// @ts-nocheck
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { AlertCircle, Timer, Send, PlayCircle, Clock, Loader2, Check, Eye, RotateCcw, Download, X, Target, FileQuestion, ChevronLeft, ChevronRight, Pencil, Info } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { submitExam, getExamResults, getExamForTaker } from '@/lib/actions';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

type Exam = NonNullable<Awaited<ReturnType<typeof getExamForTaker>>>;

export default function ExamTaker({ exam }: { exam: any }) {
    const router = useRouter();
    const questions = exam?.questions || []; // Ensure questions is defined
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

        const payload = {
            answers: userAnswers,
            timeTakenSeconds: timeTaken,
        };

        try {
            const newSubmission = await submitExam(exam.id, payload);
            if (newSubmission) {
                setSubmittedId(newSubmission.id);
                setIsSubmitting(false);
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
    }, [exam.id, timeTaken, isSubmitting, userAnswers]);

    useEffect(() => {
        if (!hasStarted || !exam.durationMinutes || isSubmitting || submittedId) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeTaken(prev => prev + 1);
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    // Time Up Logic
                    if (timerRef.current) clearInterval(timerRef.current);
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

        // Cleanup timer on component unmount to prevent memory leaks
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [hasStarted, exam.durationMinutes, showWarning, isSubmitting, submittedId]);

    const handleStart = useCallback(() => {
        setTimeTaken(0);
        setHasStarted(true);
    }, []);

    const allQuestionsAnswered = answeredQuestions.size >= questions.length;
    const unansweredCount = questions.length - answeredQuestions.size;

    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-black/90 text-foreground flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-black/0 to-black pointer-events-none" />
                <Card className="max-w-2xl w-full border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                    <CardHeader className="text-center pb-8 pt-12">
                        <CardTitle className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 mb-4">{exam.title}</CardTitle>
                        <CardDescription className="flex items-center justify-center gap-6 text-lg font-medium text-muted-foreground">
                            {exam.durationMinutes && (
                                <span className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                                    <Timer className="h-4 w-4 text-primary" /> {exam.durationMinutes} mins
                                </span>
                            )}
                            <span className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                                <FileQuestion className="h-4 w-4 text-primary" /> {questions.length} Questions
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 md:px-12 pb-12">
                        {exam.description && <p className="text-center text-muted-foreground text-lg mb-8 max-w-lg mx-auto leading-relaxed">{exam.description}</p>}

                        <div className="grid gap-4">
                            <button onClick={handleStart} className="w-full relative group overflow-hidden rounded-2xl bg-white p-4 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                <div className="relative z-10 flex items-center justify-center gap-3 text-black font-bold text-lg">
                                    <PlayCircle className="h-6 w-6" /> Start Exam Now
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-primary via-white to-primary opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                            </button>
                        </div>

                        <div className="mt-8 text-center text-xs text-muted-foreground/60 max-w-xs mx-auto">
                            By starting, you agree that the timer will begin immediately and cannot be paused.
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-foreground pt-20 pb-12 px-4 md:px-8 font-sans selection:bg-primary/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-black to-black -z-10" />

            {/* Timer Overlay */}
            {exam.durationMinutes && !submittedId && (
                <div className={cn(
                    "fixed top-4 right-4 z-50 text-sm font-bold px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md border transition-colors duration-500",
                    showWarning ? "bg-red-500/20 text-red-500 border-red-500/30 animate-pulse" : "bg-white/5 text-muted-foreground border-white/5"
                )}>
                    <Clock className="h-4 w-4" />
                    <span className="tabular-nums font-mono">{formatTime(timeLeft)}</span>
                </div>
            )}

            <div className="max-w-3xl mx-auto">
                <Card className="border-none bg-transparent shadow-none">
                    <form ref={formRef} onSubmit={handleFormSubmit}>
                        <CardContent className="p-0 space-y-8">

                            {/* Progress Stepper (Minimalist) */}
                            {!submittedId && (
                                <div className="mb-8">
                                    <div className="flex justify-between items-end mb-2 px-2">
                                        <span className="text-sm font-medium text-muted-foreground">Question {currentQuestion + 1} <span className="text-muted-foreground/40">/ {questions.length}</span></span>
                                        <span className="text-xs text-primary font-bold">{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500 ease-out"
                                            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex gap-1 mt-2 justify-center opacity-30 hover:opacity-100 transition-opacity">
                                        {questions.map((_: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={cn("h-1 w-1 rounded-full transition-colors",
                                                    idx === currentQuestion ? "bg-primary w-3" : answeredQuestions.has(_?.id ?? -1) ? "bg-green-500" : "bg-white/20")}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Question Container */}
                            {!submittedId && !showCompletionScreen && (() => {
                                const question = questions[currentQuestion];
                                if (!question) return null;

                                return (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="mb-8">
                                            <h2 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight mb-2">{question.text}</h2>
                                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-60">{question.points} Points</p>
                                        </div>

                                        {question.type === 'IMAGE_BASED_ANSWER' && question.images && (
                                            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {question.images.map(image => (
                                                    <div key={image.id} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/50">
                                                        <Image src={image.url} alt="Question Image" layout="fill" className="object-contain" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {question.type === 'MCQ' ? (
                                                question.isMultipleChoice ? (
                                                    /* CHECKBOXES */
                                                    <div className="grid gap-3">
                                                        {question.options.map(option => {
                                                            const optId = String(option.id);
                                                            const currentAnswers = userAnswers[`question-${question.id}`];
                                                            const isChecked = Array.isArray(currentAnswers) ? currentAnswers.includes(optId) : currentAnswers === optId;

                                                            return (
                                                                <label
                                                                    key={option.id}
                                                                    className={cn(
                                                                        "flex items-center space-x-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer group",
                                                                        isChecked
                                                                            ? "bg-primary/10 border-primary/50 shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)]"
                                                                            : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20"
                                                                    )}
                                                                >
                                                                    <Checkbox
                                                                        id={`option-${option.id}`}
                                                                        className="border-2 border-white/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary w-5 h-5 rounded-md transition-all"
                                                                        checked={isChecked}
                                                                        onCheckedChange={(checked) => {
                                                                            const current = userAnswers[`question-${question.id}`] || [];
                                                                            let newAnswers = Array.isArray(current) ? [...current] : [current as string];
                                                                            if (checked) { if (!newAnswers.includes(optId)) newAnswers.push(optId); }
                                                                            else { newAnswers = newAnswers.filter(id => id !== optId); }
                                                                            handleAnswerChange(question.id, newAnswers);
                                                                        }}
                                                                    />
                                                                    <span className="text-base md:text-lg font-medium opacity-90 group-hover:opacity-100">{option.text}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    /* RADIOS */
                                                    <RadioGroup
                                                        value={userAnswers[`question-${question.id}`] as string || ""}
                                                        onValueChange={(val) => handleAnswerChange(question.id, val)}
                                                        className="grid gap-3"
                                                    >
                                                        {question.options.map(option => (
                                                            <label
                                                                key={option.id}
                                                                className={cn(
                                                                    "flex items-center space-x-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer group",
                                                                    (userAnswers[`question-${question.id}`] === String(option.id))
                                                                        ? "bg-primary/10 border-primary/50 shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)]"
                                                                        : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20"
                                                                )}
                                                            >
                                                                <RadioGroupItem
                                                                    value={String(option.id)}
                                                                    id={`option-${option.id}`}
                                                                    className="border-2 border-white/40 text-primary w-5 h-5 transition-all"
                                                                />
                                                                <span className="text-base md:text-lg font-medium opacity-90 group-hover:opacity-100">{option.text}</span>
                                                            </label>
                                                        ))}
                                                    </RadioGroup>
                                                )
                                            ) : (
                                                /* TEXTAREA */
                                                <div className="relative">
                                                    <Textarea
                                                        placeholder="Type your answer here..."
                                                        rows={8}
                                                        className="bg-white/5 border-white/10 focus:border-primary/50 text-lg resize-none rounded-xl p-4 transition-all"
                                                        value={userAnswers[`question-${question.id}`] as string || ""}
                                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                    />
                                                    <div className="absolute right-3 bottom-3 text-xs text-muted-foreground pointer-events-none">Markdown Supported</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Minimal Navigation */}
                            {!submittedId && !showCompletionScreen && (
                                <div className="flex justify-between items-center pt-8 mt-8">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                                        disabled={currentQuestion === 0}
                                        className="text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent"
                                    >
                                        <ChevronLeft className="mr-2 h-5 w-5" /> Previous
                                    </Button>

                                    {currentQuestion < questions.length - 1 ? (
                                        <Button
                                            type="button"
                                            onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                                            className="rounded-full px-8 py-6 h-auto text-lg font-bold bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10"
                                        >
                                            Next Question <ChevronRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={() => setShowCompletionScreen(true)}
                                            className="rounded-full px-8 py-6 h-auto text-lg font-bold bg-primary text-black hover:bg-primary/90 shadow-xl shadow-primary/20"
                                        >
                                            Finish Exam <Check className="ml-2 h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Completion Screen */}
                            {showCompletionScreen && !submittedId && (
                                <div className="animate-in zoom-in-95 duration-300 py-12 text-center max-w-lg mx-auto">
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-6xl shadow-inner">🏁</div>
                                    <h3 className="text-3xl font-bold mb-3">All Done?</h3>
                                    <p className="text-muted-foreground text-lg mb-8">
                                        You've answered <span className={cn("font-bold text-white", unansweredCount > 0 ? "text-yellow-500" : "text-green-500")}>{answeredQuestions.size}</span> / {questions.length} questions.
                                    </p>

                                    {(!allQuestionsAnswered) && (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8 text-yellow-500 text-sm font-medium flex items-center justify-center gap-2">
                                            <AlertCircle className="h-4 w-4" /> You have unanswered questions.
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={isSubmitting}
                                            className="w-full rounded-full py-6 text-lg font-bold bg-gradient-to-r from-primary to-purple-500 text-white hover:opacity-90 transition-opacity"
                                        >
                                            {isSubmitting ? <><Loader2 className="mr-2 animate-spin" /> Submitting...</> : "Yes, Submit My Answers"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() => setShowCompletionScreen(false)}
                                            className="w-full rounded-full py-6 text-muted-foreground hover:bg-white/5 hover:text-white"
                                        >
                                            Nevermind, Review Answers
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Success Screen */}
                            {submittedId && (
                                <div className="animate-in zoom-in-95 duration-500 py-12 text-center max-w-lg mx-auto">
                                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-6xl text-green-500 shadow-[0_0_50px_-10px_rgba(34,197,94,0.4)]">✨</div>
                                    <h3 className="text-4xl font-bold mb-4 text-white">Excellent Work!</h3>
                                    <p className="text-muted-foreground text-lg mb-8">
                                        Your exam has been submitted successfully.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
                                            <DialogTrigger asChild>
                                                <Button size="lg" className="rounded-full py-6 text-lg font-bold bg-white text-black hover:bg-white/90">
                                                    Check Results
                                                </Button>
                                            </DialogTrigger>
                                        </Dialog>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSubmittedId(null);
                                                setHasStarted(false);
                                                setTimeTaken(0);
                                                setTimeLeft(exam.durationMinutes ? exam.durationMinutes * 60 : Infinity);
                                                setAnsweredQuestions(new Set());
                                                setShowCompletionScreen(false);
                                                setCurrentQuestion(0);
                                                setUserAnswers({});
                                            }}
                                            className="rounded-full py-6 border-white/10 hover:bg-white/5 transition-colors"
                                        >
                                            Back to Start
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </CardContent>

                        {/* Hidden Footer for Dialog */}
                        <CardFooter className="hidden">
                            {submittedId && (
                                <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
                                    <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col bg-[#0a0a0a] border-white/10 text-white">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold font-sans">Performance Report / ප්‍රතිඵල වාර්තාව</DialogTitle>
                                            <DialogDescription>Detailed analysis of your submission.</DialogDescription>
                                        </DialogHeader>
                                        <ScrollArea className="flex-1 pr-4">
                                            {loadingResults ? (
                                                <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                            ) : examResults ? <ResultsView examResults={examResults} /> : <p className="text-center py-10 opacity-50">No results found.</p>}
                                        </ScrollArea>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setShowResultsModal(false)} className="border-white/10 hover:bg-white/5">Close</Button>
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

// Extracted Results Component for cleaner code
function ResultsView({ examResults }: { examResults: any }) {
    const submission = examResults.submission;
    const totalPoints = submission.exam.questions.reduce((s: number, q: any) => s + q.points, 0);
    const percentage = totalPoints > 0 ? (submission.score / totalPoints) * 100 : 0;

    const correctCount = submission.exam.questions.filter((q: any) => {
        const userAnswersForQ = submission.answers.filter((a: any) => a.questionId === q.id);

        if (q.type === 'MCQ') {
            // For MCQ: check if user got at least one correct and no wrong answers
            const correctOptions = q.options?.filter((o: any) => o.isCorrect) || [];
            const userCorrectSelections = userAnswersForQ.filter((a: any) =>
                q.options?.find((o: any) => o.id === a.selectedOptionId)?.isCorrect
            ).length;
            const userWrongSelections = userAnswersForQ.filter((a: any) =>
                !q.options?.find((o: any) => o.id === a.selectedOptionId)?.isCorrect
            ).length;

            // Counted as correct only if user got all correct options and no wrong ones
            return userCorrectSelections === correctOptions.length && userWrongSelections === 0;
        }

        // For non-MCQ: check if marks were awarded
        const answer = userAnswersForQ[0];
        return answer?.marksAwarded !== null && answer?.marksAwarded > 0;
    }).length;

    const wrongCount = Math.max(0, submission.exam.questions.length - correctCount);

    return (
        <div className="space-y-8 py-4 font-sans">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-center shadow-lg">
                    <div className="text-4xl font-bold text-white mb-2">{submission.score}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Total Score</div>
                </div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-center shadow-lg">
                    <div className="text-4xl font-bold text-white mb-2">{percentage.toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Accuracy</div>
                </div>
                <div className="p-5 bg-green-500/10 rounded-2xl border border-green-500/20 text-center shadow-[0_0_30px_-10px_rgba(34,197,94,0.2)]">
                    <div className="text-4xl font-bold text-green-500 mb-2">{correctCount}</div>
                    <div className="text-xs text-green-500/70 uppercase tracking-widest">Correct</div>
                </div>
                <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20 text-center shadow-[0_0_30px_-10px_rgba(239,68,68,0.2)]">
                    <div className="text-4xl font-bold text-red-500 mb-2">{wrongCount}</div>
                    <div className="text-xs text-red-500/70 uppercase tracking-widest">Wrong</div>
                </div>
            </div>

            {/* Questions Review */}
            <div className="space-y-8">
                <h3 className="text-xl md:text-2xl font-bold flex items-center gap-3 border-b border-white/10 pb-4">
                    <FileQuestion className="h-6 w-6 text-primary" />
                    <span>Question Breakdown & Analysis</span>
                </h3>

                {submission.exam.questions.map((q: any, i: number) => {
                    const userAnswers = submission.answers.filter((a: any) => a.questionId === q.id);

                    // Advanced Calc Logic
                    const correctOptions = q.options?.filter((o: any) => o.isCorrect) || [];
                    const totalCorrectCount = correctOptions.length;

                    const userCorrectSelections = userAnswers.filter((a: any) => q.options?.find((o: any) => o.id === a.selectedOptionId)?.isCorrect).length;
                    const userWrongSelections = userAnswers.filter((a: any) => !q.options?.find((o: any) => o.id === a.selectedOptionId)?.isCorrect).length;

                    // Calculate earned marks (Proportional)
                    let earnedMarks = 0;
                    let statusText = "WRONG / වැරදියි";

                    if (q.type === 'MCQ') {
                        if (totalCorrectCount > 0) {
                            // Logic: Each correct selection gives (Points / TotalCorrect). 
                            // Any wrong selection could arguably deduct, but for now we follow the "partial for correct" rule.
                            const pointsPerCorrect = q.points / totalCorrectCount;
                            earnedMarks = Math.round(userCorrectSelections * pointsPerCorrect);

                            // Prevent negative or over-scoring (though math above shouldn't over-score unless logic changes)
                            earnedMarks = Math.min(earnedMarks, q.points);
                        }
                    } else {
                        // For non-MCQ
                        if (userAnswers[0]?.marksAwarded !== null) {
                            earnedMarks = userAnswers[0].marksAwarded;
                        }
                    }

                    const isFullMarks = earnedMarks === q.points;
                    const isZero = earnedMarks === 0;
                    const isPartial = earnedMarks > 0 && earnedMarks < q.points;
                    const lostMarks = q.points - earnedMarks;

                    if (q.type === 'MCQ') {
                        if (isFullMarks) statusText = "CORRECT / නිවැරදියි";
                        else if (isPartial) statusText = "PARTIAL / අර්ධ ලකුණු";
                        else statusText = "WRONG / වැරදියි";
                    } else {
                        if (userAnswers[0]?.marksAwarded === null) statusText = "PENDING / විමර්ශනය වෙමින්";
                        else if (isFullMarks) statusText = "CORRECT / නිවැරදියි";
                        else if (isPartial) statusText = "PARTIAL / අර්ධ ලකුණු";
                        else statusText = "WRONG / වැරදියි";
                    }

                    return (
                        <div key={q.id} className="group relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-3xl transition-all hover:bg-white/[0.04]">
                            <div className={cn("absolute left-0 top-0 bottom-0 w-1.5",
                                isFullMarks ? "bg-green-500" : isPartial ? "bg-yellow-500" : q.type !== 'MCQ' && userAnswers[0]?.marksAwarded === null ? "bg-blue-500" : "bg-red-500"
                            )} />

                            <div className="p-6 pl-8 md:p-8 md:pl-10">
                                {/* Header */}
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-2.5 py-1 rounded-md bg-white/5 text-xs font-mono text-muted-foreground">Q{i + 1}</span>
                                            <span className={cn("text-xs font-bold uppercase tracking-wider",
                                                isFullMarks ? "text-green-500" : isPartial ? "text-yellow-500" : q.type !== 'MCQ' && userAnswers[0]?.marksAwarded === null ? "text-blue-500" : "text-red-500"
                                            )}>{statusText}</span>
                                        </div>
                                        <h4 className="font-bold text-xl md:text-2xl leading-snug">{q.text}</h4>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 min-w-[100px]">
                                        <div className="text-3xl font-bold tabular-nums">
                                            {q.type !== 'MCQ' && userAnswers[0]?.marksAwarded === null ? (
                                                <span className="text-blue-500 text-xl"><Clock className="inline h-5 w-5 mb-1 mr-1" />Waiting</span>
                                            ) : (
                                                <span className={cn(isFullMarks ? "text-green-500" : isZero ? "text-red-500" : "text-yellow-500")}>
                                                    {earnedMarks}
                                                </span>
                                            )}
                                            <span className="text-lg text-muted-foreground font-normal">/{q.points}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Marks Awarded</span>
                                    </div>
                                </div>

                                {/* Options Review */}
                                <div className="space-y-3 mb-6">
                                    {q.type === 'MCQ' ? (
                                        q.options?.map((opt: any) => {
                                            const isUserChoice = userAnswers.some((a: any) => a.selectedOptionId === opt.id);
                                            const isCorrect = opt.isCorrect;

                                            // Determine styling based on state
                                            let styles = "border-white/5 bg-transparent opacity-50";
                                            let icon = null;
                                            let feedback = null;

                                            if (isUserChoice && isCorrect) {
                                                styles = "border-green-500/50 bg-green-500/10 opacity-100";
                                                icon = <Check className="h-5 w-5 text-green-500" />;
                                                feedback = <span className="text-xs text-green-400 font-medium block mt-1">✓ ඔබ තෝරපු පිළිතුර - නිවැරදියි!</span>;
                                            } else if (isUserChoice && !isCorrect) {
                                                styles = "border-red-500/50 bg-red-500/10 opacity-100";
                                                icon = <X className="h-5 w-5 text-red-500" />;
                                                feedback = <span className="text-xs text-red-500 font-medium block mt-1">✗ ඔබ තෝරපු පිළිතුර - වැරදියි!</span>;
                                            } else if (!isUserChoice && isCorrect) {
                                                // Missed correct answer styling (Green-Dot Border)
                                                styles = "border-green-500 border-2 border-dashed bg-green-500/5 opacity-100";
                                                icon = <Target className="h-5 w-5 text-green-500" />;
                                                feedback = <span className="text-xs text-green-500 font-medium block mt-1">🎯 මගහැරුණු නිවැරදි පිළිතුර (Missed)</span>;
                                            }

                                            return (
                                                <div key={opt.id} className={cn("relative p-4 rounded-xl flex items-start gap-3 transition-all cursor-default", styles)}>
                                                    <div className="mt-0.5 flex-shrink-0">{icon || <div className="w-5 h-5 rounded-full border border-white/20" />}</div>
                                                    <div className="flex-1">
                                                        <p className="text-sm md:text-base font-medium">{opt.text}</p>
                                                        {feedback}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        // Custom Answer
                                        <div className="space-y-4">
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2"><Pencil className="h-3 w-3" /> Your Answer / ඔබේ පිළිතුර:</p>
                                                <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{userAnswers[0]?.customAnswer || 'No answer provided.'}</p>
                                            </div>
                                            {userAnswers[0]?.marksAwarded === null && (
                                                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl text-blue-400 text-sm flex items-center gap-3">
                                                    <Clock className="h-5 w-5" />
                                                    <div>
                                                        <p className="font-bold">Pending Review / සමාලෝචනය වෙමින් පවතී</p>
                                                        <p className="text-xs opacity-80 mt-1">This answer is waiting for manual grading by an admin. Marks will be updated later.</p>
                                                    </div>
                                                </div>
                                            )}
                                            {userAnswers[0]?.marksAwarded !== null && (
                                                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl text-green-400 text-sm">
                                                    <p className="font-bold flex items-center gap-2"><Check className="h-4 w-4" /> Graded / ලකුණු ලබා දී ඇත</p>
                                                    {userAnswers[0].feedback && <p className="mt-2 text-white/80 border-t border-green-500/20 pt-2">📝 {userAnswers[0].feedback}</p>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Detailed Breakdown Footer */}
                                {q.type === 'MCQ' && (
                                    <div className="bg-black/20 rounded-xl p-4 text-xs md:text-sm space-y-2 border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info className="h-4 w-4 text-white/50" />
                                            <p className="font-bold text-white/50 uppercase tracking-widest text-[10px]">Analysis / විශ්ලේෂණය</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex justify-between text-muted-foreground">
                                                    <span>Correct Selections:</span>
                                                    <span>{userCorrectSelections}/{totalCorrectCount}</span>
                                                </div>
                                                <div className="flex justify-between text-muted-foreground mt-1">
                                                    <span>Wrong Selections:</span>
                                                    <span>{userWrongSelections}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center text-green-500">
                                                    <span>Earned / ලැබූ:</span>
                                                    <span className="font-bold">+{earnedMarks}</span>
                                                </div>
                                                {lostMarks > 0 && (
                                                    <div className="flex justify-between items-center text-red-500 mt-1">
                                                        <span>Lost / අහිමි:</span>
                                                        <span className="font-bold">-{lostMarks}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Advanced Sinhala Explanations */}
                                        {userCorrectSelections > 0 && userCorrectSelections < totalCorrectCount && userWrongSelections === 0 && (
                                            <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500">
                                                <p className="text-xs font-semibold">⚠️ Partial Marks Awarded</p>
                                                <p className="text-xs opacity-90 mt-1">
                                                    මෙම ප්‍රශ්නයට නිවැරදි පිළිතුරු කිහිපයක් ඇත. ඔබ ඉන් කොටසක් පමණක් තෝරාගෙන ඇති බැවින් ඔබට හිමිවන්නේ ලකුණු වලින් කොටසක් පමණි.
                                                    (Since you selected only some of the correct answers, you received partial marks.)
                                                </p>
                                            </div>
                                        )}

                                        {userWrongSelections > 0 && (
                                            <p className="text-red-400/80 text-xs mt-2 border-t border-white/5 pt-2 flex items-start gap-2">
                                                <X className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                ඔබ වැරදි පිළිතුරු {userWrongSelections} ක් තෝරාගෙන ඇති බැවින් ලකුණු අඩු වී ඇත.
                                            </p>
                                        )}
                                        {userCorrectSelections < totalCorrectCount && userWrongSelections > 0 && (
                                            <p className="text-yellow-400/80 text-xs mt-1 flex items-start gap-2">
                                                <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                තවද ඔබට නිවැරදි පිළිතුරු {totalCorrectCount - userCorrectSelections} ක් මඟ හැරී ඇත.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Helper Badge component
function Badge({ className, variant, children, ...props }: any) {
    return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)} {...props}>{children}</span>
}

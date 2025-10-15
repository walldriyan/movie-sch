
'use client';

import { notFound, redirect, useSearchParams, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getExamResults } from '@/lib/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, X, Award, Percent, Target, FileQuestion, MessageSquare, Repeat, Download, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type ExamResults = Awaited<ReturnType<typeof getExamResults>>;

export default function ExamResultsPage() {
    const searchParams = useSearchParams();
    const params = useParams<{ id: string }>();
    const submissionIdStr = searchParams.get('submissionId');
    
    const [results, setResults] = useState<ExamResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const examId = parseInt(params.id, 10);
    const submissionId = submissionIdStr ? parseInt(submissionIdStr, 10) : undefined;
    
    useEffect(() => {
        if (isNaN(examId) || submissionId === undefined || isNaN(submissionId)) {
            setError("Invalid URL parameters.");
            setIsLoading(false);
            return;
        }

        async function fetchResults() {
            try {
                const data = await getExamResults(submissionId!);
                setResults(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchResults();

    }, [examId, submissionId]);

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Alert variant="destructive" className="max-w-lg">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }
    
    if (!results) {
        return notFound();
    }
        
    const { submission } = results;
    const totalPoints = submission.exam.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = totalPoints > 0 ? (submission.score / totalPoints) * 100 : 0;
    const canRetry = submission.exam.attemptsAllowed === 0 || results.submissionCount < submission.exam.attemptsAllowed;
    
    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 print:p-0">
            <div className="max-w-4xl mx-auto">
                <Card className="print:shadow-none print:border-none">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold font-serif flex items-center gap-3">
                            <Award className="h-8 w-8 text-primary" />
                            Results for: {submission.exam.title}
                        </CardTitle>
                        <CardDescription>
                            Submitted on: {new Date(submission.submittedAt).toLocaleString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-center">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Score</CardTitle>
                                    <CardDescription className="text-3xl font-bold text-primary">{submission.score} / {totalPoints}</CardDescription>
                                </CardHeader>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Percentage</CardTitle>
                                    <CardDescription className="text-3xl font-bold">{percentage.toFixed(0)}%</CardDescription>
                                </CardHeader>
                            </Card>
                             <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                                    <CardDescription className="text-3xl font-bold">{percentage >= 50 ? "Passed" : "Failed"}</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>

                        <Separator className="my-8" />
                        
                        <h2 className="text-2xl font-semibold mb-6">Review Your Answers</h2>
                        
                        <div className="space-y-8">
                            {submission.exam.questions.map((question, index) => {
                                const userAnswer = submission.answers.find(a => a.questionId === question.id);
                                const correctOption = question.options.find(o => o.isCorrect);
                                const isCorrect = userAnswer?.selectedOptionId === correctOption?.id;

                                return (
                                    <div key={question.id}>
                                        <div className="font-semibold text-lg">{index + 1}. {question.text}</div>
                                        <p className="text-sm text-muted-foreground mb-4">{question.points} points</p>
                                        
                                        <div className="space-y-2">
                                            {question.options.map(option => {
                                                const isUserChoice = option.id === userAnswer?.selectedOptionId;
                                                const isTheCorrectAnswer = option.id === correctOption?.id;
                                                
                                                return (
                                                    <div 
                                                        key={option.id}
                                                        className={cn(
                                                            "flex items-start gap-3 p-3 rounded-lg border",
                                                            isTheCorrectAnswer && "bg-green-500/10 border-green-500/30",
                                                            isUserChoice && !isTheCorrectAnswer && "bg-red-500/10 border-red-500/30"
                                                        )}
                                                    >
                                                        <div>
                                                            {isUserChoice && isTheCorrectAnswer && <Check className="h-5 w-5 text-green-500" />}
                                                            {isUserChoice && !isTheCorrectAnswer && <X className="h-5 w-5 text-red-500" />}
                                                            {!isUserChoice && isTheCorrectAnswer && <Target className="h-5 w-5 text-green-500" />}
                                                            {!isUserChoice && !isTheCorrectAnswer && <FileQuestion className="h-5 w-5 text-muted-foreground" />}
                                                        </div>
                                                        <div className="flex-grow">
                                                            <p>{option.text}</p>
                                                            {isTheCorrectAnswer && !isUserChoice && (
                                                                 <p className="text-xs text-green-400 mt-1">Correct Answer</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                         <div className="mt-12 flex justify-center gap-4 print:hidden">
                            <Button asChild>
                                <Link href={`/movies/${submission.exam.postId}`}>Return to Post</Link>
                            </Button>
                            {canRetry && (
                                <Button asChild variant="outline">
                                    <Link href={`/exams/${submission.exam.id}`}>
                                        <Repeat className="mr-2 h-4 w-4" />
                                        Retake Exam
                                    </Link>
                                </Button>
                            )}
                             <Button variant="secondary" onClick={handlePrint}>
                                <Download className="mr-2 h-4 w-4" />
                                Download as PDF
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

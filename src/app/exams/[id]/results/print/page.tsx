
'use client';

import { notFound, useSearchParams, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getExamResults } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, X, Target, FileQuestion, Loader2, Calendar, User, Hash, Clock, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Film } from 'lucide-react';

type ExamResults = Awaited<ReturnType<typeof getExamResults>>;

const formatTime = (totalSeconds: number | null | undefined): string => {
    if (totalSeconds === null || totalSeconds === undefined) return 'N/A';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
};


// This is a self-contained layout component for printing.
// It includes its own HTML, head, and body tags with inline styles for printing.
const PrintLayout = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <html lang="en" className="print-bg">
        <head>
            <title>{title}</title>
            <style>{`
                body { 
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                @page {
                    size: A4;
                    margin: 0;
                }
                 @media print {
                    .no-print-in-layout { display: none !important; }
                    html, body {
                        width: 210mm;
                        height: 297mm;
                        background-color: #ffffff;
                        font-family: 'Inter', sans-serif;
                    }
                }
            `}</style>
        </head>
        <body className="bg-gray-200">
            {children}
        </body>
    </html>
);


export default function PrintExamResultsPage() {
    const searchParams = useSearchParams();
    const params = useParams();
    const submissionIdStr = searchParams.get('submissionId');
    
    const [results, setResults] = useState<ExamResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const examId = parseInt(params.id as string, 10);
    const submissionId = submissionIdStr ? parseInt(submissionIdStr, 10) : undefined;
    
    useEffect(() => {
        if (typeof window === 'undefined') return;

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

    useEffect(() => {
        // Automatically trigger print when data is loaded
        if (!isLoading && results && typeof window !== 'undefined') {
            // A small delay ensures all images/styles are rendered before printing
            setTimeout(() => window.print(), 500);
        }
    }, [isLoading, results]);

    if (isLoading) {
        return (
             <PrintLayout title="Loading Results...">
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="h-16 w-16 animate-spin text-gray-500" />
                </div>
            </PrintLayout>
        );
    }
    
    if (error) {
        return (
             <PrintLayout title="Error">
                <div className="flex items-center justify-center h-screen p-8">
                    <Alert variant="destructive" className="max-w-lg bg-white">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Certificate</AlertTitle>
                        <AlertDescription>
                            {error}
                            <div className="mt-4 no-print-in-layout">
                                <a href="/" className="text-blue-500 underline">Return to homepage</a>
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            </PrintLayout>
        );
    }
    
    if (!results) {
        return notFound();
    }
        
    const { submission, user } = results;
    const totalPoints = submission.exam.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = totalPoints > 0 ? (submission.score / totalPoints) * 100 : 0;
    
    return (
        <PrintLayout title={`Results for ${submission.exam.title}`}>
            <div className="p-8 md:p-12 lg:p-16 bg-white shadow-lg mx-auto my-8 max-w-4xl printable-area">
                <header className="text-center mb-12 border-b-2 border-gray-200 pb-8">
                     <div className="inline-flex items-center space-x-3 mb-4">
                        <Film className="h-10 w-10 text-green-500" />
                        <span className="inline-block font-bold text-4xl text-gray-800" style={{fontFamily: 'serif'}}>
                            CineVerse
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800" style={{fontFamily: 'serif'}}>{submission.exam.title}</h1>
                    <p className="text-xl text-gray-500" style={{fontFamily: 'serif'}}>Exam Result Certificate</p>
                </header>

                <main>
                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold border-b pb-2 mb-4 text-gray-700">Submission Details</h2>
                         <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-lg">
                             <div className="flex items-center gap-3">
                                 <User className="h-5 w-5 text-gray-500" />
                                 <strong>Student:</strong>
                                 <span>{user.name}</span>
                             </div>
                              <div className="flex items-center gap-3">
                                 <Calendar className="h-5 w-5 text-gray-500" />
                                 <strong>Date:</strong>
                                 <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                             </div>
                              <div className="flex items-center gap-3">
                                 <Hash className="h-5 w-5 text-gray-500" />
                                 <strong>Submission ID:</strong>
                                 <span>#{submission.id}</span>
                             </div>
                             <div className="flex items-center gap-3">
                                 <Clock className="h-5 w-5 text-gray-500" />
                                 <strong>Time Taken:</strong>
                                 <span>{formatTime(submission.timeTakenSeconds)}</span>
                             </div>
                         </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold border-b pb-2 mb-6 text-gray-700">Overall Score</h2>
                        <div className="grid grid-cols-3 gap-6 text-center">
                            <div className="bg-gray-50 p-6 rounded-lg border">
                                <p className="text-base text-gray-500">Total Score</p>
                                <p className="text-4xl font-bold text-green-500">{submission.score} / {totalPoints}</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg border">
                                <p className="text-base text-gray-500">Percentage</p>
                                <p className="text-4xl font-bold text-gray-700">{percentage.toFixed(0)}%</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg border">
                                <p className="text-base text-gray-500">Result</p>
                                <p className={`text-4xl font-bold ${percentage >= 50 ? 'text-green-500' : 'text-red-500'}`}>{percentage >= 50 ? "Passed" : "Failed"}</p>
                            </div>
                        </div>
                    </section>
                    
                     <section className="break-before-page">
                        <h2 className="text-2xl font-semibold border-b pb-2 mb-6 text-gray-700">Answer Review</h2>
                        <div className="space-y-8">
                            {submission.exam.questions.map((question, index) => {
                                const userAnswersIds = submission.answers
                                    .filter(a => a.questionId === question.id)
                                    .map(a => a.selectedOptionId);
                                    
                                const correctOptionIds = question.options
                                    .filter(o => o.isCorrect)
                                    .map(o => o.id);

                                return (
                                    <div key={question.id} className="p-4 border border-gray-200 rounded-lg break-inside-avoid">
                                        <p className="font-bold text-gray-800">{index + 1}. {question.text} <span className="font-normal text-gray-500">({question.points} points)</span></p>
                                        
                                        <div className="mt-4 space-y-3">
                                            {question.options.map(option => {
                                                const isUserChoice = userAnswersIds.includes(option.id);
                                                const isTheCorrectAnswer = correctOptionIds.includes(option.id);
                                                
                                                return (
                                                    <div 
                                                        key={option.id}
                                                        className={cn(
                                                            "flex items-start gap-3 p-3 rounded-md text-sm border",
                                                            isTheCorrectAnswer && "bg-green-50 border-green-300",
                                                            isUserChoice && !isTheCorrectAnswer && "bg-red-50 border-red-300"
                                                        )}
                                                    >
                                                        <div className="flex-shrink-0">
                                                            {isUserChoice && isTheCorrectAnswer && <Check className="h-5 w-5 text-green-500" />}
                                                            {isUserChoice && !isTheCorrectAnswer && <X className="h-5 w-5 text-red-500" />}
                                                            {!isUserChoice && isTheCorrectAnswer && <Target className="h-5 w-5 text-green-500" />}
                                                            {!isUserChoice && !isTheCorrectAnswer && (question.isMultipleChoice ? <CircleDot className="h-5 w-5 text-muted-foreground" /> : <FileQuestion className="h-5 w-5 text-gray-400" />)}
                                                        </div>
                                                        <div className="flex-grow">
                                                            <p className={cn(isTheCorrectAnswer && 'font-semibold', isUserChoice && !isTheCorrectAnswer && 'line-through')}>{option.text}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </main>
                
                <footer className="text-center mt-12 pt-8 border-t-2 border-gray-200 text-gray-400 text-sm">
                    <p>This is an automatically generated certificate from CineVerse Learning Platform.</p>
                    <p>&copy; {new Date().getFullYear()} CineVerse. All rights reserved.</p>
                </footer>
            </div>
        </PrintLayout>
    );
}


'use client';

import { notFound, useSearchParams, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getExamResults } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, X, Target, FileQuestion, Loader2, Calendar, User, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Film } from 'lucide-react';

type ExamResults = Awaited<ReturnType<typeof getExamResults>>;

// This is a self-contained layout component for printing.
// It includes its own HTML, head, and body tags with inline styles for printing.
const PrintLayout = ({ children }: { children: React.ReactNode }) => (
    <html lang="en" className="print-bg">
        <head>
            <title>Exam Results</title>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Space+Grotesk:wght@400;700&display=swap');
                
                body { 
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    background-color: #ffffff;
                    font-family: 'Inter', sans-serif;
                    line-height: 1.6;
                    color: #333333;
                }
                .font-serif {
                    font-family: 'Space Grotesk', sans-serif;
                }
                @page {
                    size: A4;
                    margin: 15mm;
                }
                .print-container {
                    max-width: 100%;
                    margin: 0 auto;
                }
                .brand-color { color: #22c55e; } /* green-500 */
                .no-print-in-layout { display: none; }
                /* Utility classes to be used in the component */
                .bg-gray-50 { background-color: #f9fafb; }
                .p-6 { padding: 1.5rem; }
                .rounded-lg { border-radius: 0.5rem; }
                .text-base { font-size: 1rem; line-height: 1.5rem; }
                .text-gray-500 { color: #6b7280; }
                .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
                .font-bold { font-weight: 700; }
                .text-gray-700 { color: #374151; }
                .text-green-500 { color: #22c55e; }
                .text-red-500 { color: #ef4444; }
                .grid { display: grid; }
                .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                .gap-6 { gap: 1.5rem; }
                .text-center { text-align: center; }
                .mb-10 { margin-bottom: 2.5rem; }
                .border-b { border-bottom-width: 1px; }
                .pb-2 { padding-bottom: 0.5rem; }
                .mb-4 { margin-bottom: 1rem; }
                .mb-6 { margin-bottom: 1.5rem; }
                .text-2xl { font-size: 1.5rem; line-height: 2rem; }
                .font-semibold { font-weight: 600; }
                .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .gap-x-8 { column-gap: 2rem; }
                .gap-y-4 { row-gap: 1rem; }
                .flex { display: flex; }
                .items-center { align-items: center; }
                .gap-3 { gap: 0.75rem; }
                .h-5 { height: 1.25rem; }
                .w-5 { width: 1.25rem; }
                .space-y-8 > :not([hidden]) ~ :not([hidden]) { margin-top: 2rem; }
                .p-4 { padding: 1rem; }
                .border { border-width: 1px; border-color: #e5e7eb; }
                .rounded-lg { border-radius: 0.5rem; }
                .text-gray-800 { color: #1f2937; }
                .font-normal { font-weight: 400; }
                .mt-4 { margin-top: 1rem; }
                .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
                .items-start { align-items: flex-start; }
                .rounded-md { border-radius: 0.375rem; }
                .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
                .bg-green-50 { background-color: #f0fdf4; }
                .border-l-4 { border-left-width: 4px; }
                .border-green-400 { border-color: #4ade80; }
                .bg-red-50 { background-color: #fef2f2; }
                .border-red-400 { border-color: #f87171; }
                .flex-shrink-0 { flex-shrink: 0; }
                .flex-grow { flex-grow: 1; }
                .line-through { text-decoration-line: line-through; }
                .text-gray-400 { color: #9ca3ac; }
                .mt-12 { margin-top: 3rem; }
                .pt-8 { padding-top: 2rem; }
                .border-t-2 { border-top-width: 2px; }
                .border-gray-200 { border-color: #e5e7eb; }
                .text-gray-400 { color: #9ca3ac; }
                .inline-flex { display: inline-flex; }
                .space-x-3 > :not([hidden]) ~ :not([hidden]) { margin-left: 0.75rem; }
                .h-10 { height: 2.5rem; }
                .w-10 { width: 2.5rem; }
                .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
                .mb-12 { margin-bottom: 3rem; }
                .pb-8 { padding-bottom: 2rem; }
                .border-b-2 { border-bottom-width: 2px; }
            `}</style>
        </head>
        <body>
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
             <PrintLayout>
                <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
                    <Loader2 className="h-16 w-16 animate-spin text-gray-500" />
                </div>
            </PrintLayout>
        );
    }
    
    if (error) {
        return (
             <PrintLayout>
                <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
                    <Alert variant="destructive" className="max-w-lg">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {error}
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
        <PrintLayout>
            <div className="print-container">
                <header className="text-center mb-12 border-b-2 border-gray-200 pb-8">
                     <div className="inline-flex items-center space-x-3 mb-4">
                        <Film className="h-10 w-10 brand-color" />
                        <span className="inline-block font-bold font-serif text-4xl text-gray-800">
                            CineVerse
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold font-serif text-gray-800">{submission.exam.title}</h1>
                    <p className="text-xl text-gray-500 font-serif">Exam Result Certificate</p>
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
                         </div>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold border-b pb-2 mb-6 text-gray-700">Overall Score</h2>
                        <div className="grid grid-cols-3 gap-6 text-center">
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <p className="text-base text-gray-500">Total Score</p>
                                <p className="text-4xl font-bold brand-color">{submission.score} / {totalPoints}</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <p className="text-base text-gray-500">Percentage</p>
                                <p className="text-4xl font-bold text-gray-700">{percentage.toFixed(0)}%</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <p className="text-base text-gray-500">Result</p>
                                <p className={`text-4xl font-bold ${percentage >= 50 ? 'text-green-500' : 'text-red-500'}`}>{percentage >= 50 ? "Passed" : "Failed"}</p>
                            </div>
                        </div>
                    </section>
                    
                     <section>
                        <h2 className="text-2xl font-semibold border-b pb-2 mb-6 text-gray-700">Answer Review</h2>
                        <div className="space-y-8">
                            {submission.exam.questions.map((question, index) => {
                                const userAnswer = submission.answers.find(a => a.questionId === question.id);
                                const correctOption = question.options.find(o => o.isCorrect);

                                return (
                                    <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                                        <p className="font-bold text-gray-800">{index + 1}. {question.text} <span className="font-normal text-gray-500">({question.points} points)</span></p>
                                        
                                        <div className="mt-4 space-y-3">
                                            {question.options.map(option => {
                                                const isUserChoice = option.id === userAnswer?.selectedOptionId;
                                                const isTheCorrectAnswer = option.isCorrect;
                                                
                                                return (
                                                    <div 
                                                        key={option.id}
                                                        className={cn(
                                                            "flex items-start gap-3 p-3 rounded-md text-sm",
                                                            isTheCorrectAnswer && "bg-green-50 border-l-4 border-green-400",
                                                            isUserChoice && !isTheCorrectAnswer && "bg-red-50 border-l-4 border-red-400"
                                                        )}
                                                    >
                                                        <div>
                                                            {isUserChoice && isTheCorrectAnswer && <Check className="h-5 w-5 text-green-500 flex-shrink-0" />}
                                                            {isUserChoice && !isTheCorrectAnswer && <X className="h-5 w-5 text-red-500 flex-shrink-0" />}
                                                            {!isUserChoice && isTheCorrectAnswer && <Target className="h-5 w-5 text-green-500 flex-shrink-0" />}
                                                            {!isUserChoice && !isTheCorrectAnswer && <FileQuestion className="h-5 w-5 text-gray-400 flex-shrink-0" />}
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

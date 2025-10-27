

'use client';

import { notFound, redirect, useSearchParams, useParams } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { getExamResults } from '@/lib/actions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, X, Award, Percent, Target, FileQuestion, MessageSquare, Repeat, Download, Loader2, Calendar, User, Hash, Clock, CircleDot, CheckCircle, XCircle, HelpCircle, Pencil, FileText, Certificate, Film } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type ExamResults = Awaited<ReturnType<typeof getExamResults>>;

const formatTime = (totalSeconds: number | null | undefined): string => {
    if (totalSeconds === null || totalSeconds === undefined) return 'N/A';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
};

// New component for the printable view
const CertificateView = ({ results }: { results: ExamResults | null }) => {
    if (!results) return null;

    const { submission, user } = results;
    const totalPoints = submission.exam.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = totalPoints > 0 ? (submission.score / totalPoints) * 100 : 0;
    
    return (
        <div className="printable-certificate font-sans text-black bg-white">
             <header className="text-center mb-12 border-b-2 border-gray-200 pb-8">
                <div className="inline-flex items-center space-x-3 mb-4">
                    <Film className="h-10 w-10 text-primary" />
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
                            <p className="text-4xl font-bold text-primary">{submission.score} / {totalPoints}</p>
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
            </main>
            
            <footer className="text-center mt-12 pt-8 border-t-2 border-gray-200 text-gray-400 text-sm">
                <p>This is an automatically generated certificate from CineVerse Learning Platform.</p>
                <p>&copy; {new Date().getFullYear()} CineVerse. All rights reserved.</p>
            </footer>
        </div>
    );
};

const numberToSinhala = (num: number) => {
    const words = ["", "පළමු", "දෙවන", "තෙවන", "හතරවන", "පස්වන", "හයවන", "හත්වන", "අටවන", "නවවන", "දසවන"];
    if (num <= 10) return words[num];
    return `${num} වන`;
}

export default function ExamResultsPage() {
    const searchParams = useSearchParams();
    const params = useParams();
    const submissionIdStr = searchParams.get('submissionId');
    
    const [results, setResults] = useState<ExamResults | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const examId = parseInt(params.id as string, 10);
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

    const calculateQuestionScore = useMemo(() => (question: NonNullable<ExamResults>['submission']['exam']['questions'][0]) => {
        if (!results) return 0;
        const { submission } = results;
        if (question.type !== 'MCQ') return 0; // Don't calculate for non-MCQ

        const userAnswersForQuestion = submission.answers
            .filter(a => a.questionId === question.id)
            .map(a => a.selectedOptionId);

        if (userAnswersForQuestion.length === 0) return 0;

        const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id);
        const pointsPerCorrectAnswer = correctOptionIds.length > 0 ? question.points / correctOptionIds.length : 0;
        const pointsToDeductPerWrong = correctOptionIds.length > 0 ? question.points / correctOptionIds.length : 0;
        
        let score = 0;
        if (question.isMultipleChoice) {
            userAnswersForQuestion.forEach(id => {
                if (correctOptionIds.includes(id)) {
                    score += pointsPerCorrectAnswer;
                } else {
                    score -= pointsToDeductPerWrong; 
                }
            });
        } else {
            const selectedOptionId = userAnswersForQuestion[0];
            if (correctOptionIds.includes(selectedOptionId)) {
                score = question.points;
            } else {
                 score = -question.points; // Incorrect single choice should result in negative points before clamping
            }
        }
        return Math.max(0, Math.round(score));
    }, [results]);

    const scoreBreakdown = useMemo(() => {
        if (!results) return { positive: 0, negative: 0, missed: 0 };
        const { submission } = results;
        let positiveMarks = 0;
        let negativeMarks = 0;
        let missedMarks = 0;

        submission.exam.questions.forEach(question => {
            if (question.type !== 'MCQ') return; // Skip non-MCQ questions

            const userAnswersIds = submission.answers.filter(a => a.questionId === question.id).map(a => a.selectedOptionId);
            const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id);
            const pointsPerCorrectAnswer = correctOptionIds.length > 0 ? question.points / correctOptionIds.length : 0;

            if (question.isMultipleChoice) {
                userAnswersIds.forEach(id => {
                    if (correctOptionIds.includes(id)) {
                        positiveMarks += pointsPerCorrectAnswer;
                    } else {
                        negativeMarks += pointsPerCorrectAnswer;
                    }
                });
                correctOptionIds.forEach(id => {
                    if (!userAnswersIds.includes(id)) {
                        missedMarks += pointsPerCorrectAnswer;
                    }
                });
            } else {
                const selectedId = userAnswersIds[0];
                if (selectedId && correctOptionIds.includes(selectedId)) {
                    positiveMarks += question.points;
                } else if (selectedId) { // Wrong answer selected
                    negativeMarks += question.points;
                } else { // No answer selected
                     missedMarks += question.points;
                }
            }
        });

        return {
            positive: Math.round(positiveMarks),
            negative: Math.round(negativeMarks),
            missed: Math.round(missedMarks),
        };
    }, [results]);

    const handlePrint = (contentId: string) => {
        const printContent = document.getElementById(contentId)?.innerHTML;
        if (!printContent) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) {
            document.body.removeChild(iframe);
            return;
        }

        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>Print</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: sans-serif; }
                        @page { size: A4; margin: 0; }
                        .printable-certificate, .printable-detailed { padding: 1.5rem; }
                        .break-inside-avoid { break-inside: avoid; }
                    </style>
                </head>
                <body>${printContent}</body>
            </html>
        `);
        doc.close();
        
        iframe.contentWindow?.focus();
        setTimeout(() => {
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        }, 500); // Timeout to ensure content is loaded
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
        <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
            <div id="printable-certificate-content" className="hidden">
              <CertificateView results={results}/>
            </div>
             <div id="printable-detailed-content" className="hidden">
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">{submission.exam.title} - Detailed Results</h1>
                <p>Student: {results.user.name}</p>
                <p>Date: {new Date(submission.submittedAt).toLocaleString()}</p>
                <p className="font-bold mt-4">Final Score: {submission.score} / {totalPoints}</p>
                <hr className="my-4" />
                 <div className="space-y-4">
                    {submission.exam.questions.map((question, index) => (
                        <div key={question.id}>
                            <p className="font-semibold">{index + 1}. {question.text}</p>
                            {question.type === 'MCQ' ? (
                                <ul className="list-disc pl-5 mt-2">
                                {question.options.map(option => {
                                    const isUserChoice = submission.answers.some(a => a.questionId === question.id && a.selectedOptionId === option.id);
                                    return (
                                    <li key={option.id} className={cn(
                                        option.isCorrect && 'text-green-500 font-semibold',
                                        isUserChoice && !option.isCorrect && 'text-red-500'
                                    )}>
                                        {option.text} {isUserChoice && '(Your answer)'}
                                    </li>
                                    )
                                })}
                                </ul>
                            ) : (
                                <p className="mt-2 text-gray-500 italic">Your answer: {submission.answers.find(a => a.questionId === question.id)?.customAnswer || 'N/A'}</p>
                            )}
                        </div>
                    ))}
                 </div>
              </div>
            </div>
            
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold font-serif flex items-center gap-3">
                            <Award className="h-8 w-8 text-primary" />
                            Results for: {submission.exam.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground pt-1">
                            Submitted on: {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 text-center">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Score</CardTitle>
                                     <CardDescription className={cn("text-3xl font-bold", percentage >= 50 ? "text-primary" : "text-destructive")}>
                                        {submission.score} / {totalPoints}
                                    </CardDescription>
                                     <div className="text-xs font-semibold mt-1 space-y-1">
                                        <div className="flex items-center justify-center gap-1.5 text-green-500">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            <span>Correct: +{scoreBreakdown.positive}</span>
                                        </div>
                                         <div className="flex items-center justify-center gap-1.5 text-destructive">
                                            <XCircle className="h-3.5 w-3.5" />
                                            <span>Incorrect: -{scoreBreakdown.negative}</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5 text-orange-400">
                                            <HelpCircle className="h-3.5 w-3.5" />
                                            <span>Missed: {scoreBreakdown.missed}</span>
                                        </div>
                                    </div>
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
                                    <CardDescription className={cn("text-3xl font-bold", percentage >= 50 ? "text-primary" : "text-destructive")}>{percentage >= 50 ? "Passed" : "Failed"}</CardDescription>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Time Taken</CardTitle>
                                    <CardDescription className="text-3xl font-bold">{formatTime(submission.timeTakenSeconds)}</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                        
                        <h2 className="text-2xl font-semibold mb-6">Review Your Answers</h2>
                        
                        <div className="space-y-4">
                            {submission.exam.questions.map((question, index) => {
                                 const userAnswer = submission.answers.find(a => a.questionId === question.id);
                                
                                return (
                                    <React.Fragment key={question.id}>
                                    <Card className="bg-card/30 border-dashed p-6">
                                        <CardHeader className="p-0 mb-4">
                                            <p className="font-serif text-xs text-muted-foreground uppercase tracking-wider">{numberToSinhala(index + 1)} ප්‍රශ්නය</p>
                                            <CardTitle className="text-lg">{question.text} <span className="text-sm font-normal text-muted-foreground">({question.points} points)</span></CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            {question.type === 'MCQ' ? (
                                                <>
                                                    <div className="space-y-2">
                                                        {question.options.map(option => {
                                                            const isUserChoice = submission.answers.some(a => a.questionId === question.id && a.selectedOptionId === option.id);
                                                            const isTheCorrectAnswer = option.isCorrect;
                                                            const pointsPerCorrectAnswer = question.options.filter(o => o.isCorrect).length > 0 ? question.points / question.options.filter(o => o.isCorrect).length : 0;

                                                            return (
                                                                <div 
                                                                    key={option.id}
                                                                    className={cn(
                                                                        "flex items-start gap-3 p-3 rounded-lg border",
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
                                                                        {isUserChoice && isTheCorrectAnswer && <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">නිවැරදි පිළිතුර (ඔබ තේරූ) <span className="font-bold ml-2 text-green-500">(+{pointsPerCorrectAnswer.toFixed(1)} ලකුණු)</span></p>}
                                                                        {isUserChoice && !isTheCorrectAnswer && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">වැරදි පිළිතුර (ඔබ තේරූ) <span className="font-bold ml-2 text-red-500">(-{pointsPerCorrectAnswer.toFixed(1)} ලකුණු)</span></p>}
                                                                        {!isUserChoice && isTheCorrectAnswer && <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">නිවැරදි පිළිතුර (ඔබ නොතේරූ)</p>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                     <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                                                        <p className="font-semibold">ලකුණු: <span className="font-bold text-primary">{calculateQuestionScore(question)}</span> / {question.points}</p>
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
                                                        <Label className="text-sm font-semibold text-muted-foreground">Your Answer:</Label>
                                                        <Textarea 
                                                            readOnly 
                                                            value={userAnswer?.customAnswer || "No answer provided."}
                                                            className="mt-2 bg-background/50 text-base"
                                                        />
                                                    </div>
                                                     <div className="mt-4 p-3 bg-blue-500/10 rounded-lg text-sm border border-blue-500/20">
                                                        <p className="font-semibold text-blue-300 flex items-center gap-2"><Pencil className="h-4 w-4" />Answer Pending Review</p>
                                                        <p className="text-xs text-blue-400/80 mt-1">This answer will be graded manually by an administrator.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                    {index < submission.exam.questions.length - 1 && <Separator className="my-8"/>}
                                    </React.Fragment>
                                );
                            })}
                        </div>

                         <div className="mt-12 flex flex-wrap justify-center gap-4">
                            {canRetry && (
                                <Button asChild variant="outline">
                                    <Link href={`/exams/${submission.exam.id}`}>
                                        <Repeat className="mr-2 h-4 w-4" />
                                        Retake Exam
                                    </Link>
                                </Button>
                            )}
                             <Button variant="secondary" onClick={() => handlePrint('printable-detailed-content')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Download Detailed PDF
                            </Button>
                             <Button onClick={() => handlePrint('printable-certificate-content')}>
                                <Certificate className="mr-2 h-4 w-4" />
                                Download Certificate
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

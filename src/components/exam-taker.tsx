
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { AlertCircle, Timer, Send, PlayCircle, Clock } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { submitExam } from '@/lib/actions';
import type { getExamForTaker } from '@/lib/actions';
import { useFormStatus } from 'react-dom';

type Exam = NonNullable<Awaited<ReturnType<typeof getExamForTaker>>>;

export default function ExamTaker({ exam }: { exam: Exam }) {
    const [hasStarted, setHasStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(exam.durationMinutes ? exam.durationMinutes * 60 : Infinity);
    const [showWarning, setShowWarning] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const { pending } = useFormStatus();

    const submitExamWithId = submitExam.bind(null, exam.id);

    useEffect(() => {
        if (!hasStarted || !exam.durationMinutes || pending) {
            return;
        }

        if (timeLeft <= 0) {
            if (formRef.current && !pending) {
               formRef.current.requestSubmit();
            }
            return;
        }
        
        if (timeLeft <= 60 && !showWarning) {
            setShowWarning(true);
        }

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [hasStarted, timeLeft, exam.durationMinutes, showWarning, pending]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const SubmitButton = () => {
        return (
            <Button type="submit" size="lg" disabled={pending}>
                {pending ? (
                    <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Exam
                    </>
                )}
            </Button>
        )
    }

    if (!hasStarted) {
        return (
             <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 flex items-center justify-center">
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
                        <Button size="lg" onClick={() => setHasStarted(true)}>
                            <PlayCircle className="mr-2 h-5 w-5" />
                            Start Exam
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                             <div>
                                <CardTitle className="text-3xl font-bold font-serif">{exam.title}</CardTitle>
                                <CardDescription className="pt-2">{exam.questions.length} questions</CardDescription>
                             </div>
                             {exam.durationMinutes && (
                                <div className={`text-2xl font-mono font-semibold p-2 rounded-lg flex items-center gap-2 ${showWarning ? 'bg-destructive/20 text-destructive' : 'bg-muted'}`}>
                                    <Clock className="h-6 w-6" />
                                    <span>{formatTime(timeLeft)}</span>
                                </div>
                             )}
                        </div>
                    </CardHeader>
                    <form action={submitExamWithId} ref={formRef}>
                        <CardContent className="space-y-8">
                            {exam.questions.map((question, qIndex) => (
                                <div key={question.id}>
                                    <Separator className={qIndex > 0 ? 'mb-8' : ''}/>
                                    <div className="font-semibold text-lg">{qIndex + 1}. {question.text}</div>
                                    <p className="text-sm text-muted-foreground mb-4">{question.points} points</p>
                                    <RadioGroup name={`question-${question.id}`} required className="space-y-2">
                                        {question.options.map(option => (
                                            <div key={option.id} className="flex items-center space-x-2 p-3 rounded-lg border border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                                                <RadioGroupItem value={String(option.id)} id={`option-${option.id}`} />
                                                <Label htmlFor={`option-${option.id}`} className="flex-grow cursor-pointer">{option.text}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter>
                           <SubmitButton />
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

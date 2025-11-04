
'use client';

import React from 'react';
import { useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Trash2, PlusCircle, ImageIcon } from 'lucide-react';
import { QuestionImageUploader } from './question-image-uploader';


export const QuestionItem = ({ control, qIndex, removeQuestion, form }: { control: any, qIndex: number, removeQuestion: (index: number) => void, form: any }) => {
    const { fields: options, append: appendOption, remove: removeOption } = useFieldArray({ control, name: `questions.${qIndex}.options` });
    const { fields: images, append: appendImage, remove: removeImage } = useFieldArray({ control, name: `questions.${qIndex}.images` });

    const questionType = form.watch(`questions.${qIndex}.type`);
    const isMultipleChoice = form.watch(`questions.${qIndex}.isMultipleChoice`);
    
    const handleQuestionTypeChange = (value: string) => {
        console.log(`[STEP 4] QuestionItem: Question type changed for Q${qIndex}. New type: ${value}. Full form data:`, form.getValues());
        form.setValue(`questions.${qIndex}.type`, value);
    }

    return (
        <Card key={qIndex} className="mb-6 border-dashed">
             <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Question {qIndex + 1}</CardTitle>
                <Button type="button" variant="destructive" size="icon" onClick={() => removeQuestion(qIndex)}><Trash2 className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="md:col-span-2">
                         <FormField control={control} name={`questions.${qIndex}.text`} render={({ field }) => (<FormItem><FormLabel>Question Text</FormLabel><FormControl><Textarea placeholder="e.g., What was the spinning top's purpose?" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="md:col-span-1">
                         <FormField control={control} name={`questions.${qIndex}.type`} render={({ field }) => (
                            <FormItem><FormLabel>Question Type</FormLabel>
                                <Select onValueChange={handleQuestionTypeChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="MCQ">Multiple Choice</SelectItem>
                                        <SelectItem value="IMAGE_BASED_ANSWER">Image-Based Answer</SelectItem>
                                    </SelectContent>
                                </Select>
                            <FormMessage /></FormItem>
                         )} />
                    </div>
                    <div className="md:col-span-1">
                         <FormField control={control} name={`questions.${qIndex}.points`} render={({ field }) => (<FormItem><FormLabel>Points</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
               </div>
               <Separator className="my-4"/>

               {questionType === 'MCQ' ? (
                <>
                    <FormField
                        control={control}
                        name={`questions.${qIndex}.isMultipleChoice`}
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (!checked) {
                                                let foundFirst = false;
                                                form.getValues(`questions.${qIndex}.options`).forEach((opt: any, oIndex: number) => {
                                                    if (opt.isCorrect) {
                                                        if (foundFirst) {
                                                            form.setValue(`questions.${qIndex}.options.${oIndex}.isCorrect`, false);
                                                        }
                                                        foundFirst = true;
                                                    }
                                                });
                                            }
                                        }}
                                    />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">Allow multiple correct answers</FormLabel>
                            </FormItem>
                        )}
                    />
                    <h4 className="font-semibold text-sm mt-4">Options</h4>
                    <div className="space-y-3">
                    {options.map((option, oIndex) => (
                        <div key={option.id} className="flex items-center gap-2">
                            <FormField 
                                    control={control} 
                                    name={`questions.${qIndex}.options.${oIndex}.isCorrect`} 
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox 
                                                    checked={field.value} 
                                                    onCheckedChange={(checked) => {
                                                        if (!isMultipleChoice) {
                                                            form.getValues(`questions.${qIndex}.options`).forEach((opt: any, idx: number) => {
                                                                if (idx !== oIndex) {
                                                                    form.setValue(`questions.${qIndex}.options.${idx}.isCorrect`, false);
                                                                }
                                                            });
                                                        }
                                                        field.onChange(checked);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="text-sm font-normal pt-1">Correct</FormLabel>
                                        </FormItem>
                                    )} 
                                />
                            <FormField control={control} name={`questions.${qIndex}.options.${oIndex}.text`} render={({ field }) => (<FormItem className="flex-grow"><FormControl><Input placeholder={`Option ${oIndex + 1}`} {...field} /></FormControl></FormItem>)} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(oIndex)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                        </div>
                    ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendOption({ text: '', isCorrect: false })}><PlusCircle className="mr-2 h-4 w-4" />Add Option</Button>
                </>
               ) : (
                <>
                    <h4 className="font-semibold text-sm">Images for Question</h4>
                     <div className="space-y-3">
                        {images.map((image, iIndex) => (
                             <div key={iIndex} className="flex items-center gap-2">
                                <QuestionImageUploader qIndex={qIndex} iIndex={iIndex} form={form} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeImage(iIndex)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                             </div>
                        ))}
                    </div>
                     <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendImage({ url: '' })}><ImageIcon className="mr-2 h-4 w-4" />Add Image</Button>
                </>
               )}
            </CardContent>
        </Card>
    );
};

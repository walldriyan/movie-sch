
'use client';

import React, { useCallback } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from '@/components/ui/calendar';
import { Save, Settings, Loader2, Calendar as CalendarIconLucide, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PostCombobox } from './post-combobox';
import { QuestionItem } from './question-item';
import type { Post, Group } from '@prisma/client';

type PostWithGroup = Post & { group: { name: string } | null };

export const CreateExamForm = ({ posts, groups, form, questions, appendQuestion, removeQuestion, isSubmitting, onSubmit, onBack, editingExamId, onPostsChange }: {
  posts: PostWithGroup[],
  groups: Group[],
  form: any,
  questions: any[],
  appendQuestion: any,
  removeQuestion: any,
  isSubmitting: boolean,
  onSubmit: (data: any) => void,
  onBack: () => void,
  editingExamId: number | null,
  onPostsChange: (posts: PostWithGroup[]) => void,
}) => {

  const assignmentType = form.watch('assignmentType');
  const handleRemoveQuestion = useCallback((index: number) => {
    removeQuestion(index);
  }, [removeQuestion]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Section 1: Basic Details */}
        <Card>
            <CardHeader>
                <CardTitle>{editingExamId ? 'Edit Exam' : 'Create New Exam'}</CardTitle>
                <CardDescription>Basic information and settings for the exam.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Exam Title</FormLabel><FormControl><Input placeholder="e.g., 'Inception' plot details quiz" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A brief description of what this exam covers." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                
                <FormField
                  control={form.control}
                  name="assignmentType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Assign To</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="POST" />
                            </FormControl>
                            <FormLabel className="font-normal">Public on Post</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="GROUP" />
                            </FormControl>
                            <FormLabel className="font-normal">Specific User Group</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField 
                    control={form.control} 
                    name="postId" 
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>Associated Post</FormLabel>
                          <PostCombobox 
                              field={field} 
                              initialPosts={posts} 
                              onPostsChange={onPostsChange} 
                          />
                           <FormDescription>
                            Optionally associate a post. If assigning to a group, this is not required but can provide context.
                           </FormDescription>
                          <FormMessage />
                      </FormItem>
                    )} 
                />

                {assignmentType === 'GROUP' && (
                   <FormField
                    control={form.control}
                    name="groupId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Associated Group</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {groups.map(group => (
                              <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
            </CardContent>
        </Card>

        {/* Section 2: Settings */}
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Exam Settings</CardTitle><CardDescription>Configuration and rules.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="durationMinutes" render={({ field }) => (<FormItem><FormLabel>Duration (Minutes)</FormLabel><FormControl><Input type="number" placeholder="e.g., 30" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Leave empty for no time limit.</FormDescription><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="attemptsAllowed" render={({ field }) => (<FormItem><FormLabel>Attempts Allowed</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Use 0 for unlimited attempts.</FormDescription><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIconLucide className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarIcon mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                     <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>End Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIconLucide className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarIcon mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                </div>
            </CardContent>
        </Card>

        {/* Section 3: Questions */}
        <Card>
          <CardHeader><CardTitle>Exam Questions</CardTitle><CardDescription>Add questions and options for the exam.</CardDescription></CardHeader>
          <CardContent>
            {questions.map((question, qIndex) => (<QuestionItem key={question.id || qIndex} control={form.control} qIndex={qIndex} removeQuestion={handleRemoveQuestion} form={form}/>))}
            <Button type="button" variant="secondary" onClick={() => appendQuestion({ text: '', points: 10, type: 'MCQ', isMultipleChoice: false, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }], images: [] })}><PlusCircle className="mr-2 h-4 w-4" />Add Question</Button>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end sticky bottom-0 py-4 bg-background/80 backdrop-blur-sm gap-2">
            <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving...</> : <><Save className="mr-2 h-5 w-5" />{editingExamId ? 'Update Exam' : 'Save Exam'}</>}
            </Button>
        </div>
      </form>
    </Form>
  )
}
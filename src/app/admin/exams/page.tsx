
'use client';

import React, { useTransition } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { BookCheck, PlusCircle, Trash2, Calendar as CalendarIconLucide, Clock, Save, Settings, ChevronsUpDown, Loader2, Info, Eye, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getPostsForAdmin } from '@/lib/actions';
import type { Post } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { createOrUpdateExam } from '@/lib/actions/exams';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const optionSchema = z.object({
  text: z.string().min(1, 'Option text cannot be empty.'),
  isCorrect: z.boolean().default(false),
});

const questionSchema = z.object({
  text: z.string().min(1, 'Question text cannot be empty.'),
  points: z.coerce.number().min(1, 'Points must be at least 1.'),
  options: z.array(optionSchema).min(2, 'At least two options are required.'),
});

const examSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  postId: z.string().min(1, 'A post must be selected.'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  durationMinutes: z.coerce.number().optional(),
  attemptsAllowed: z.coerce.number().min(0, 'Attempts must be 0 or more. 0 for unlimited.').default(1),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  questions: z.array(questionSchema).min(1, 'At least one question is required.'),
});

type ExamFormValues = z.infer<typeof examSchema>;
type PostWithGroup = Post & { group: { name: string } | null };


// New component for a single question to fix the hook error
const QuestionItem = ({ control, qIndex, removeQuestion }: { control: any, qIndex: number, removeQuestion: (index: number) => void }) => {
    const { fields: options, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: `questions.${qIndex}.options`,
    });

    return (
        <Card key={qIndex} className="mb-6 border-dashed">
             <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Question {qIndex + 1}</CardTitle>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeQuestion(qIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="md:col-span-3">
                         <FormField
                            control={control}
                            name={`questions.${qIndex}.text`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Question Text</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., What was the spinning top's purpose?" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div>
                         <FormField
                            control={control}
                            name={`questions.${qIndex}.points`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Points</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="10" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
               </div>

               <Separator className="my-4"/>
               <h4 className="font-semibold text-sm">Options</h4>
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
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal pt-1">
                                        Correct Answer
                                    </FormLabel>
                                    </FormItem>
                                )}
                            />
                           <FormField
                                control={control}
                                name={`questions.${qIndex}.options.${oIndex}.text`}
                                render={({ field }) => (
                                    <FormItem className="flex-grow">
                                    <FormControl>
                                        <Input placeholder={`Option ${oIndex + 1}`} {...field} />
                                    </FormControl>
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(oIndex)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                       </div>
                   ))}
               </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => appendOption({ text: '', isCorrect: false })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
            </CardContent>
        </Card>
    );
};


export default function CreateExamPage() {
  const [isSubmitting, startTransition] = useTransition();
  const [posts, setPosts] = React.useState<PostWithGroup[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchPosts() {
        try {
            const { posts: fetchedPosts } = await getPostsForAdmin({
                page: 1,
                limit: 100, 
                userId: 'dummy-id',
                userRole: 'SUPER_ADMIN',
            });
            setPosts(fetchedPosts as PostWithGroup[]);
        } catch(error) {
            toast({
                variant: 'destructive',
                title: 'Failed to load posts',
                description: 'Could not fetch the list of posts for the dropdown.'
            })
        }
    }
    fetchPosts();
  }, [toast]);


  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '',
      description: '',
      postId: '',
      status: 'DRAFT',
      durationMinutes: 30,
      attemptsAllowed: 1,
      questions: [{ text: '', points: 10, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }],
    },
  });

  const { fields: questions, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const watchedPostId = useWatch({ control: form.control, name: 'postId' });
  const selectedPost = React.useMemo(() => posts.find(p => String(p.id) === watchedPostId), [posts, watchedPostId]);
  
  function onSubmit(data: ExamFormValues) {
    startTransition(async () => {
        try {
            await createOrUpdateExam(data);
            toast({
                title: 'Exam Saved!',
                description: `The exam "${data.title}" has been successfully saved.`,
            });
            form.reset();
        } catch (error: any) {
            console.error('--- Exam Save Error ---', error);
            toast({
                variant: 'destructive',
                title: 'Failed to Save Exam',
                description: error.message || 'An unexpected error occurred.',
            });
        }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl flex items-center gap-2">
            <BookCheck className="h-6 w-6" />
            Create & Manage Exams
        </h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Exam Details</CardTitle>
                    <CardDescription>Basic information and settings for the exam.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 'Inception' plot details quiz" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="A brief description of what this exam covers." {...field} />
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a post to link this exam to" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {posts.map(post => (
                                        <SelectItem key={post.id} value={String(post.id)}>{post.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Exam Access</CardTitle>
                    <CardDescription>Who can take this exam is determined by the associated post's visibility.</CardDescription>
                </CardHeader>
                <CardContent>
                    {selectedPost ? (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle className="flex items-center gap-2">
                                {selectedPost.visibility === 'PUBLIC' ? (
                                    <><Eye className="h-4 w-4" /> Public Exam</>
                                ) : (
                                    <><Users className="h-4 w-4" /> Group Exam</>
                                )}
                            </AlertTitle>
                            <AlertDescription>
                                This exam will be available to{' '}
                                {selectedPost.visibility === 'PUBLIC'
                                ? 'all users.'
                                : `members of the "${selectedPost.group?.name || 'Unknown'}" group.`}
                                <br />
                                To change this, edit the visibility of the post itself.
                            </AlertDescription>
                        </Alert>
                    ) : (
                         <Alert variant="destructive">
                             <ChevronsUpDown className="h-4 w-4" />
                            <AlertTitle>No Post Selected</AlertTitle>
                            <AlertDescription>
                                Please select an associated post to see its access settings.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>


            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Exam Settings</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                </SelectContent>
                           </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (Minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 30" {...field} />
                          </FormControl>
                          <FormDescription>Leave empty for no time limit.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="attemptsAllowed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Attempts Allowed</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                           <FormDescription>Use 0 for unlimited attempts.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIconLucide className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <CalendarIcon
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIconLucide className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <CalendarIcon
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
            </Card>

            <div>
                {questions.map((question, qIndex) => (
                    <QuestionItem
                        key={question.id}
                        control={form.control}
                        qIndex={qIndex}
                        removeQuestion={removeQuestion}
                    />
                ))}
                 <Button
                    type="button"
                    variant="secondary"
                    onClick={() => appendQuestion({ text: '', points: 10, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] })}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Another Question
                </Button>
            </div>

            <div className="flex justify-end sticky bottom-0 py-4 bg-background/80 backdrop-blur-sm">
                <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-5 w-5" />
                            Save Exam
                        </>
                    )}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}

    

    
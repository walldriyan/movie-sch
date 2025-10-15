
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { BookCheck, PlusCircle, Trash2, Calendar as CalendarIconLucide, Save, Settings, ChevronsUpDown, Loader2, Info, Eye, Users, List, Edit, MoreHorizontal, FileText, BarChart2, Check, Download, Upload } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar as CalendarIcon } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getPostsForAdmin, searchPostsForExam } from '@/lib/actions';
import type { Post } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { createOrUpdateExam, getExamsForAdmin, getExamForEdit, deleteExam } from '@/lib/actions/exams';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const optionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, 'Option text cannot be empty.'),
  isCorrect: z.boolean().default(false),
});

const questionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, 'Question text cannot be empty.'),
  points: z.coerce.number().min(1, 'Points must be at least 1.'),
  isMultipleChoice: z.boolean().default(false),
  options: z.array(optionSchema).min(2, 'At least two options are required.')
    .refine(options => options.some(opt => opt.isCorrect), {
        message: 'At least one option must be marked as correct.'
    }),
});

const examSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  postId: z.string().min(1, 'A post must be selected.'),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  durationMinutes: z.coerce.number().optional().nullable(),
  attemptsAllowed: z.coerce.number().min(0, 'Attempts must be 0 or more. 0 for unlimited.').default(1),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  questions: z.array(questionSchema).min(1, 'At least one question is required.'),
});

type ExamFormValues = z.infer<typeof examSchema>;
type PostWithGroup = Post & { group: { name: string } | null };
type ExamForListing = Awaited<ReturnType<typeof getExamsForAdmin>>[0];

// New component for a single question
const QuestionItem = ({ control, qIndex, removeQuestion, form }: { control: any, qIndex: number, removeQuestion: (index: number) => void, form: any }) => {
    const { fields: options, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: `questions.${qIndex}.options`,
    });

    const isMultipleChoice = form.watch(`questions.${qIndex}.isMultipleChoice`);

    return (
        <Card key={qIndex} className="mb-6 border-dashed">
             <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Question {qIndex + 1}</CardTitle>
                <Button type="button" variant="destructive" size="icon" onClick={() => removeQuestion(qIndex)}><Trash2 className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="md:col-span-3">
                         <FormField control={control} name={`questions.${qIndex}.text`} render={({ field }) => (<FormItem><FormLabel>Question Text</FormLabel><FormControl><Textarea placeholder="e.g., What was the spinning top's purpose?" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div>
                         <FormField control={control} name={`questions.${qIndex}.points`} render={({ field }) => (<FormItem><FormLabel>Points</FormLabel><FormControl><Input type="number" placeholder="10" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
               </div>
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
                                        // If switching from multiple to single, uncheck all but the first correct answer
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
                                                onCheckedChange={(checked) => {
                                                    if (!isMultipleChoice) {
                                                        // Uncheck all other options
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
            </CardContent>
        </Card>
    );
};

const PostCombobox = ({
    field,
    initialPosts,
    onPostsChange,
}: {
    field: any,
    initialPosts: PostWithGroup[],
    onPostsChange: (posts: PostWithGroup[]) => void,
}) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, startSearchTransition] = useTransition();

    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery.length > 2) {
                startSearchTransition(async () => {
                    const fetchedPosts = await searchPostsForExam(searchQuery);
                    // Combine initial posts and fetched posts, removing duplicates
                    const allPosts = [...initialPosts, ...fetchedPosts as PostWithGroup[]];
                    const uniquePosts = Array.from(new Map(allPosts.map(p => [p.id, p])).values());
                    onPostsChange(uniquePosts);
                });
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery, initialPosts, onPostsChange]);


    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                        )}
                    >
                        {field.value
                            ? initialPosts.find(
                                (post) => String(post.id) === field.value
                            )?.title
                            : "Select a post"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput 
                        placeholder="Search posts..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        {isSearching && <div className="p-2 text-sm text-center text-muted-foreground">Searching...</div>}
                        <CommandEmpty>No post found.</CommandEmpty>
                        <CommandGroup>
                            {initialPosts.map((post) => (
                                <CommandItem
                                    value={post.title}
                                    key={post.id}
                                    onSelect={() => {
                                        field.onChange(String(post.id));
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            String(post.id) === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {post.title}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

const CreateExamForm = ({ posts, selectedPost, form, questions, appendQuestion, removeQuestion, isSubmitting, onSubmit, onBack, editingExamId, onPostsChange }: {
  posts: PostWithGroup[],
  selectedPost: PostWithGroup | undefined,
  form: any,
  questions: any[],
  appendQuestion: any,
  removeQuestion: any,
  isSubmitting: boolean,
  onSubmit: (data: ExamFormValues) => void,
  onBack: () => void,
  editingExamId: number | null,
  onPostsChange: (posts: PostWithGroup[]) => void,
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    name="postId" 
                    render={({ field }) => (
                      <FormItem>
                          <FormLabel>Associated Post</FormLabel>
                          <PostCombobox 
                              field={field} 
                              initialPosts={posts} 
                              onPostsChange={onPostsChange} 
                          />
                          <FormMessage />
                      </FormItem>
                    )} 
                  />
              </CardContent>
          </Card>
          
          <Card>
              <CardHeader><CardTitle>Exam Access</CardTitle><CardDescription>Who can take this exam is determined by the associated post's visibility.</CardDescription></CardHeader>
              <CardContent>
                  {selectedPost ? (<Alert><Info className="h-4 w-4" /><AlertTitle className="flex items-center gap-2">{selectedPost.visibility === 'PUBLIC' ? (<><Eye className="h-4 w-4" /> Public</>) : (<><Users className="h-4 w-4" /> Group</>)}</AlertTitle><AlertDescription>This exam will be available to {selectedPost.visibility === 'PUBLIC' ? 'all users.' : `members of the "${selectedPost.group?.name || 'Unknown'}" group.`}</AlertDescription></Alert>) : (<Alert variant="destructive"><ChevronsUpDown className="h-4 w-4" /><AlertTitle>No Post Selected</AlertTitle><AlertDescription>Please select a post to see access settings.</AlertDescription></Alert>)}
              </CardContent>
          </Card>

          <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Exam Settings</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="durationMinutes" render={({ field }) => (<FormItem><FormLabel>Duration (Minutes)</FormLabel><FormControl><Input type="number" placeholder="e.g., 30" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Leave empty for no time limit.</FormDescription><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="attemptsAllowed" render={({ field }) => (<FormItem><FormLabel>Attempts Allowed</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Use 0 for unlimited attempts.</FormDescription><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="startDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Start Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIconLucide className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarIcon mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="endDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>End Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}<CalendarIconLucide className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><CalendarIcon mode="single" selected={field.value ?? undefined} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
              </CardContent>
          </Card>

          <div>
              {questions.map((question, qIndex) => (<QuestionItem key={question.id} control={form.control} qIndex={qIndex} removeQuestion={removeQuestion} form={form}/>))}
               <Button type="button" variant="secondary" onClick={() => appendQuestion({ text: '', points: 10, isMultipleChoice: false, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] })}><PlusCircle className="mr-2 h-4 w-4" />Add Question</Button>
          </div>

          <div className="flex justify-end sticky bottom-0 py-4 bg-background/80 backdrop-blur-sm">
               <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting}>Cancel</Button>
               <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Saving...</> : <><Save className="mr-2 h-5 w-5" />{editingExamId ? 'Update Exam' : 'Save Exam'}</>}</Button>
          </div>
      </form>
    </Form>
  )
}

const ManageExamsList = ({ exams, onEdit, onDelete, onExport }: { exams: ExamForListing[], onEdit: (id: number) => void, onDelete: (id: number) => void, onExport: (id: number) => void }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Exams</CardTitle>
                <CardDescription>View, edit, or delete existing exams.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Post</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Questions</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {exams.length > 0 ? exams.map(exam => (
                            <TableRow key={exam.id}>
                                <TableCell className="font-medium">{exam.title}</TableCell>
                                <TableCell className="text-muted-foreground">{exam.post.title}</TableCell>
                                <TableCell><Badge variant={exam.status === 'ACTIVE' ? 'default' : 'secondary'}>{exam.status}</Badge></TableCell>
                                <TableCell>{exam._count.questions}</TableCell>
                                <TableCell className="text-right">
                                     <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(exam.id)}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                <DropdownMenuItem><BarChart2 className="mr-2 h-4 w-4"/>View Results</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onExport(exam.id)}><Download className="mr-2 h-4 w-4"/>Export as JSON</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem></AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the exam "{exam.title}" and all its submissions. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDelete(exam.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                     </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No exams found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}


export default function CreateExamPage() {
  const [activeTab, setActiveTab] = useState('manage');
  const [isSubmitting, startTransition] = useTransition();
  const [posts, setPosts] = React.useState<PostWithGroup[]>([]);
  const [exams, setExams] = useState<ExamForListing[]>([]);
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const { toast } = useToast();
  const importFileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '', description: '', postId: '', status: 'DRAFT',
      durationMinutes: 30, attemptsAllowed: 1, questions: [],
    },
  });

  const { fields: questions, append: appendQuestion, remove: removeQuestion, replace: replaceQuestions } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const watchedPostId = form.watch('postId');
  const selectedPost = React.useMemo(() => posts.find(p => String(p.id) === watchedPostId), [posts, watchedPostId]);
  
  const fetchPosts = async () => {
      try {
          const { posts: fetchedPosts } = await getPostsForAdmin({ page: 1, limit: 10, userId: 'dummy-id', userRole: 'SUPER_ADMIN', sortBy: 'createdAt-desc' });
          setPosts(fetchedPosts as PostWithGroup[]);
      } catch(error) {
          toast({ variant: 'destructive', title: 'Failed to load posts', description: 'Could not fetch posts list.'})
      }
  }

  const fetchExams = async () => {
    try {
      const fetchedExams = await getExamsForAdmin();
      setExams(fetchedExams);
    } catch(error) {
       toast({ variant: 'destructive', title: 'Failed to load exams', description: 'Could not fetch the list of exams.'})
    }
  }

  useEffect(() => {
    fetchPosts();
    fetchExams();
  }, []);

  const handleEdit = async (examId: number) => {
    try {
        const examToEdit = await getExamForEdit(examId);
        if (examToEdit) {
            setEditingExamId(examId);
            const postInList = posts.find(p => p.id === examToEdit.postId);
            if (!postInList && examToEdit.post) {
                setPosts(prev => [examToEdit.post as PostWithGroup, ...prev]);
            }
            form.reset({
                title: examToEdit.title,
                description: examToEdit.description || '',
                postId: String(examToEdit.postId),
                status: examToEdit.status,
                durationMinutes: examToEdit.durationMinutes,
                attemptsAllowed: examToEdit.attemptsAllowed,
                startDate: examToEdit.startDate,
                endDate: examToEdit.endDate,
                questions: examToEdit.questions.map(q => ({
                  id: q.id,
                  text: q.text,
                  points: q.points,
                  isMultipleChoice: q.isMultipleChoice,
                  options: q.options.map(o => ({ id: o.id, text: o.text, isCorrect: o.isCorrect }))
                }))
            });
            setActiveTab('create');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Exam data could not be found.' });
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error loading exam', description: error.message });
    }
  };

  const handleDelete = (examId: number) => {
    startTransition(async () => {
      try {
        await deleteExam(examId);
        toast({ title: "Exam Deleted", description: "The exam has been successfully deleted." });
        await fetchExams();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
      }
    })
  }

  const handleExport = async (examId: number) => {
     try {
        const examToExport = await getExamForEdit(examId);
        if (examToExport) {
            // Remove IDs and other DB-specific fields
            const cleanExam = {
                title: examToExport.title,
                description: examToExport.description,
                status: examToExport.status,
                durationMinutes: examToExport.durationMinutes,
                attemptsAllowed: examToExport.attemptsAllowed,
                questions: examToExport.questions.map(q => ({
                    text: q.text,
                    points: q.points,
                    isMultipleChoice: q.isMultipleChoice,
                    options: q.options.map(o => ({
                        text: o.text,
                        isCorrect: o.isCorrect,
                    })),
                })),
            };

            const jsonString = JSON.stringify(cleanExam, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${examToExport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({ title: "Export successful", description: `"${examToExport.title}" has been exported.`});
        }
     } catch (error: any) {
        toast({ variant: 'destructive', title: 'Export Failed', description: error.message });
     }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result;
            if (typeof content !== 'string') {
                throw new Error('Failed to read file content.');
            }
            const importedData = JSON.parse(content);
            
            // Validate and set form data
            const validatedData = examSchema.partial().safeParse(importedData);
            if (validatedData.success) {
                const data = validatedData.data;
                 form.reset({
                    ...form.getValues(),
                    title: data.title || '',
                    description: data.description || '',
                    status: data.status || 'DRAFT',
                    durationMinutes: data.durationMinutes,
                    attemptsAllowed: data.attemptsAllowed || 1,
                    questions: data.questions || [],
                });
                setEditingExamId(null);
                setActiveTab('create');
                toast({ title: "Import Successful", description: "Exam data has been loaded into the form."});
            } else {
                console.error("Validation failed:", validatedData.error);
                throw new Error("Invalid JSON structure for an exam.");
            }

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
        } finally {
            // Reset file input
            if (importFileInputRef.current) {
                importFileInputRef.current.value = "";
            }
        }
    }
    reader.readAsText(file);
  }
  
  function onSubmit(data: ExamFormValues) {
    startTransition(async () => {
        try {
            await createOrUpdateExam(data, editingExamId);
            toast({ title: 'Exam Saved!', description: `The exam "${data.title}" has been saved.` });
            form.reset();
            setEditingExamId(null);
            replaceQuestions([]); // Clear questions field array
            setActiveTab('manage');
            await fetchExams();
        } catch (error: any) {
            console.error('--- Exam Save Error ---', error);
            toast({ variant: 'destructive', title: 'Failed to Save Exam', description: error.message || 'An unexpected error occurred.' });
        }
    });
  }

  const handleNewExamClick = () => {
    form.reset({
        title: '', description: '', postId: '', status: 'DRAFT',
        durationMinutes: 30, attemptsAllowed: 1, questions: [{ text: '', points: 10, isMultipleChoice: false, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] }],
    });
    setEditingExamId(null);
    setActiveTab('create');
  }

  const handleBack = () => {
    form.reset();
    setEditingExamId(null);
    replaceQuestions([]);
    setActiveTab('manage');
  }


  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl flex items-center gap-2"><BookCheck className="h-6 w-6" />Exam Center</h1>
        <div className="flex gap-2">
            <input 
                type="file" 
                ref={importFileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleImport}
            />
            <Button variant="outline" onClick={() => importFileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Import Exam</Button>
            <Button onClick={handleNewExamClick}><PlusCircle className="mr-2 h-4 w-4" />Create New Exam</Button>
        </div>
      </div>

       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Manage Exams</TabsTrigger>
          <TabsTrigger value="create">{editingExamId ? 'Edit Exam' : 'Create Exam'}</TabsTrigger>
        </TabsList>
        <TabsContent value="manage" className="mt-6">
          <ManageExamsList exams={exams} onEdit={handleEdit} onDelete={handleDelete} onExport={handleExport} />
        </TabsContent>
        <TabsContent value="create" className="mt-6">
          <CreateExamForm 
            posts={posts}
            selectedPost={selectedPost}
            form={form}
            questions={questions}
            appendQuestion={appendQuestion}
            removeQuestion={removeQuestion}
            isSubmitting={isSubmitting}
            onSubmit={onSubmit}
            onBack={handleBack}
            editingExamId={editingExamId}
            onPostsChange={setPosts}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


'use client';

import React, { useState, useEffect, useTransition, useCallback, useRef } from 'react';
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
import { BookCheck, PlusCircle, Trash2, Calendar as CalendarIconLucide, Save, Settings, ChevronsUpDown, Loader2, Info, Eye, Users, List, Edit, MoreHorizontal, FileText, BarChart2, Check, Download, Upload, FileQuestion, ArrowLeft, ArrowRight, Folder, Image as ImageIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar as CalendarIcon } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getPostsForAdmin, searchPostsForExam, getGroupsForForm } from '@/lib/actions';
import type { Post, Group, QuestionImage } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { createOrUpdateExam, getExamsForAdmin, getExamForEdit, deleteExam, uploadExamImage } from '@/lib/actions/exams';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';

// Import newly created modules
import { CreateExamForm } from './exam-modules/create-exam-form';
import { ManageExamsList } from './exam-modules/manage-exams-list';

const optionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, 'Option text cannot be empty.'),
  isCorrect: z.boolean().default(false),
});

const imageUrlSchema = z.object({
  url: z.string().min(1, "Image URL is required."),
});

const questionSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, 'Question text cannot be empty.'),
  points: z.coerce.number().min(1, 'Points must be at least 1.'),
  type: z.enum(['MCQ', 'IMAGE_BASED_ANSWER']).default('MCQ'),
  isMultipleChoice: z.boolean().default(false),
  options: z.array(optionSchema),
  images: z.array(imageUrlSchema).optional().default([]),
}).superRefine((data, ctx) => {
    if (data.type === 'MCQ') {
        if (data.options.length < 2) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['options'],
                message: 'At least two options are required for an MCQ question.'
            });
        }
        if (!data.options.some(opt => opt.isCorrect)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['options'],
                message: 'At least one option must be marked as correct for an MCQ question.'
            });
        }
    } else if (data.type === 'IMAGE_BASED_ANSWER') {
        if (!data.images || data.images.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['images'],
                message: 'At least one image URL is required for an image-based question.'
            });
        }
    }
});

const examSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  assignmentType: z.enum(['POST', 'GROUP']).default('POST'),
  postId: z.string().optional(),
  groupId: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  durationMinutes: z.coerce.number().optional().nullable(),
  attemptsAllowed: z.coerce.number().min(0, 'Attempts must be 0 or more. 0 for unlimited.').default(1),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  questions: z.array(questionSchema).min(1, 'At least one question is required.'),
}).superRefine((data, ctx) => {
    if (data.assignmentType === 'GROUP' && !data.groupId) {
        ctx.addIssue({
            code: 'custom',
            path: ['groupId'],
            message: 'A group must be selected when assigning to a group.',
        });
    }
});


type ExamFormValues = z.infer<typeof examSchema>;
type PostWithGroup = Post & { group: { name: string } | null };
type ExamForListing = Awaited<ReturnType<typeof getExamsForAdmin>>[0];


interface ExamsClientProps {
    initialPosts: PostWithGroup[];
    initialGroups: Group[];
    initialExams: ExamForListing[];
}

export default function ExamsClient({ initialPosts, initialGroups, initialExams }: ExamsClientProps) {
  console.log('[STEP 1] ExamsClient: Component is rendering.');
  const [activeTab, setActiveTab] = useState('manage');
  const [isSubmitting, startTransition] = useTransition();
  const [posts, setPosts] = React.useState<PostWithGroup[]>(initialPosts);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [exams, setExams] = useState<ExamForListing[]>(initialExams);
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const { toast } = useToast();
  const importFileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: '', description: '', assignmentType: 'POST', postId: '', groupId: '', status: 'DRAFT',
      durationMinutes: 30, attemptsAllowed: 1, questions: [],
    },
  });

  const { fields: questions, append: appendQuestion, remove: removeQuestion, replace: replaceQuestions } = useFieldArray({
    control: form.control,
    name: 'questions',
  });
  
  const fetchExams = useCallback(async () => {
    console.log('[STEP 2] fetchExams: Fetching list of exams.');
    setIsLoadingExams(true);
    try {
      const fetchedExams = await getExamsForAdmin();
      setExams(fetchedExams);
    } catch(error) {
       toast({ variant: 'destructive', title: 'Failed to load exams', description: 'Could not fetch the list of exams.'})
    } finally {
      setIsLoadingExams(false);
    }
  }, [toast]);

  const handleEdit = useCallback(async (examId: number) => {
    console.log(`[STEP 3] handleEdit: User clicked edit for exam ID ${examId}.`);
    try {
        const examToEdit = await getExamForEdit(examId);
        if (examToEdit) {
            console.log(`[STEP 3.1] handleEdit: Successfully fetched exam data for ID ${examId}.`);
            setEditingExamId(examId);
            
            if (examToEdit.postId) {
              const postInList = posts.find(p => p.id === examToEdit.postId);
              if (!postInList && examToEdit.post) {
                  setPosts(prev => [examToEdit.post as PostWithGroup, ...prev]);
              }
            }
            
            form.reset({
                title: examToEdit.title,
                description: examToEdit.description || '',
                assignmentType: examToEdit.groupId ? 'GROUP' : 'POST',
                postId: examToEdit.postId ? String(examToEdit.postId) : undefined,
                groupId: examToEdit.groupId ? String(examToEdit.groupId) : undefined,
                status: examToEdit.status,
                durationMinutes: examToEdit.durationMinutes,
                attemptsAllowed: examToEdit.attemptsAllowed,
                startDate: examToEdit.startDate,
                endDate: examToEdit.endDate,
                questions: examToEdit.questions.map(q => ({
                  id: q.id,
                  text: q.text,
                  points: q.points,
                  type: q.type,
                  isMultipleChoice: q.isMultipleChoice,
                  options: q.options.map(o => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
                  images: q.images.map(img => ({ url: img.url }))
                }))
            });
            setActiveTab('create');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Exam data could not be found.' });
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error loading exam', description: error.message });
    }
  }, [form, posts, toast]);

  const handleDelete = useCallback((examId: number) => {
    console.log(`[STEP 3] handleDelete: User clicked delete for exam ID ${examId}.`);
    startTransition(async () => {
      try {
        await deleteExam(examId);
        toast({ title: "Exam Deleted", description: "The exam has been successfully deleted." });
        await fetchExams();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
      }
    })
  }, [fetchExams, toast]);

  const handleExport = useCallback(async (examId: number) => {
    console.log(`[STEP 3] handleExport: User clicked export for exam ID ${examId}.`);
     try {
        const examToExport = await getExamForEdit(examId);
        if (examToExport) {
            const cleanExam = {
                title: examToExport.title,
                description: examToExport.description,
                status: examToExport.status,
                durationMinutes: examToExport.durationMinutes,
                attemptsAllowed: examToExport.attemptsAllowed,
                questions: examToExport.questions.map(q => ({
                    text: q.text,
                    points: q.points,
                    type: q.type,
                    isMultipleChoice: q.isMultipleChoice,
                    options: q.options.map(o => ({
                        text: o.text,
                        isCorrect: o.isCorrect,
                    })),
                    images: q.images.map(img => ({ url: img.url })),
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
  }, [toast]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`[STEP 3] handleImport: User selected a file to import.`);
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
            console.log(`[STEP 3.1] handleImport: File parsed successfully.`, importedData);
            
            const normalizedQuestions = importedData.questions.map((q: any) => ({
                text: q.text || '',
                points: q.points || 10,
                type: q.type || 'MCQ',
                isMultipleChoice: q.isMultipleChoice || false,
                options: q.options || [],
                images: q.images || [],
            }));

            const questionsValidation = z.array(questionSchema).safeParse(normalizedQuestions);

            if (!questionsValidation.success) {
                console.error("Questions validation failed:", questionsValidation.error);
                throw new Error("Invalid question structure in JSON file.");
            }

            form.reset({
                ...form.getValues(),
                title: importedData.title || '',
                description: importedData.description || '',
                status: importedData.status || 'DRAFT',
                durationMinutes: importedData.durationMinutes,
                attemptsAllowed: importedData.attemptsAllowed || 1,
                questions: questionsValidation.data || [],
                postId: undefined,
                groupId: undefined,
                assignmentType: 'POST',
                startDate: undefined,
                endDate: undefined,
            });

            setEditingExamId(null);
            setActiveTab('create');
            toast({ title: "Import Successful", description: "Exam data has been loaded into the form."});
            
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
        } finally {
            if (importFileInputRef.current) {
                importFileInputRef.current.value = "";
            }
        }
    }
    reader.readAsText(file);
  }, [form, toast]);
  
  const onSubmit = useCallback((data: ExamFormValues) => {
    console.log('[STEP 4] onSubmit: Form submitted. Preparing data for server action.', data);
    startTransition(async () => {
      try {
        await createOrUpdateExam(data, editingExamId);
        toast({ title: 'Exam Saved!', description: `The exam "${data.title}" has been saved.` });
        form.reset();
        setEditingExamId(null);
        replaceQuestions([]);
        setActiveTab('manage');
        await fetchExams();
      } catch (error: any) {
        console.error('[ERROR] Submission Error:', error);
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message });
      }
    });
  }, [editingExamId, fetchExams, form, replaceQuestions, toast]);

  const handleNewExamClick = useCallback(() => {
    console.log(`[STEP 3] handleNewExamClick: User clicked 'Create New Exam'.`);
    form.reset({
        title: '', description: '', assignmentType: 'POST', postId: '', groupId: '', status: 'DRAFT',
        durationMinutes: 30, attemptsAllowed: 1, questions: [{ text: '', points: 10, type: 'MCQ', isMultipleChoice: false, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }], images: [] }],
    });
    setEditingExamId(null);
    setActiveTab('create');
  }, [form]);

  const handleBack = useCallback(() => {
    console.log(`[STEP 3] handleBack: User clicked 'Cancel' in form.`);
    form.reset();
    setEditingExamId(null);
    replaceQuestions([]);
    setActiveTab('manage');
  }, [form, replaceQuestions]);

  const handleTabChange = useCallback((newTab: string) => {
    if (newTab === 'create' && activeTab !== 'create') {
        handleNewExamClick();
    } else if (newTab === 'manage') {
        handleBack();
    } else {
        setActiveTab(newTab);
    }
  }, [activeTab, handleNewExamClick, handleBack]);


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

       <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Manage Exams</TabsTrigger>
          <TabsTrigger value="create">{editingExamId ? 'Edit Exam' : 'Create Exam'}</TabsTrigger>
        </TabsList>
        <TabsContent value="manage" className="mt-6">
          <ManageExamsList exams={exams} onEdit={handleEdit} onDelete={handleDelete} onExport={handleExport} isLoading={isLoadingExams} isDeleting={isSubmitting} />
        </TabsContent>
        <TabsContent value="create" className="mt-6">
          <div className="mt-6">
            <CreateExamForm 
              posts={posts}
              groups={groups}
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

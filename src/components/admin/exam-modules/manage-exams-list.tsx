
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Edit, BarChart2, Download, Trash2, Folder, FileText } from 'lucide-react';
import Link from 'next/link';

type ExamForListing = {
  id: number;
  title: string;
  status: string;
  post: { title: string } | null;
  group: { name: string } | null;
  _count: { questions: number };
};

interface ManageExamsListProps {
    exams: ExamForListing[];
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
    onExport: (id: number) => void;
    isLoading: boolean;
    isDeleting: boolean;
}


export const ManageExamsList = ({ exams, onEdit, onDelete, onExport, isLoading, isDeleting }: ManageExamsListProps) => {
    
    const SkeletonRow = () => (
      <TableRow>
        <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
        <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-5 w-8" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
      </TableRow>
    );

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
                            <TableHead>Associated With</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Questions</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading || isDeleting ? (
                            <>
                                <SkeletonRow />
                                <SkeletonRow />
                                <SkeletonRow />
                            </>
                        ) : exams.length > 0 ? exams.map(exam => (
                            <TableRow key={exam.id}>
                                <TableCell className="font-medium">{exam.title}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {exam.group ? (
                                        <div className='flex items-center gap-2'>
                                            <Folder className="h-4 w-4" />
                                            <span>{exam.group.name}</span>
                                        </div>
                                     ) : exam.post ? (
                                        <div className='flex items-center gap-2'>
                                            <FileText className="h-4 w-4" />
                                            <span>{exam.post.title}</span>
                                        </div>
                                    ) : 'N/A'}
                                </TableCell>
                                <TableCell><Badge variant={exam.status === 'ACTIVE' ? 'default' : 'secondary'}>{exam.status}</Badge></TableCell>
                                <TableCell>{exam._count.questions}</TableCell>
                                <TableCell className="text-right">
                                     <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(exam.id)}><Edit className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/exams/${exam.id}/results`}><BarChart2 className="mr-2 h-4 w-4"/>View Results</Link>
                                                </DropdownMenuItem>
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

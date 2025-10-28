
'use client';

import React, { useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { createMicroPostComment, updateMicroPostComment } from '@/lib/actions';
import type { MicroPostComment as CommentType } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


const commentFormSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty.').max(1000, 'Comment cannot exceed 1000 characters.'),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

interface CommentFormProps {
  postId: string;
  parentId?: string;
  existingComment?: CommentType;
  onCommentCreated: (newComment: CommentType) => void;
  onCancel?: () => void;
}

export default function CommentForm({ postId, parentId, onCommentCreated, existingComment, onCancel }: CommentFormProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();
  const user = session?.user;

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: existingComment?.content || '',
    },
  });
  
  if (!user) {
      return (
          <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
              You must be logged in to comment.
          </div>
      )
  }

  const onSubmit = (values: CommentFormValues) => {
    startTransition(async () => {
      try {
        let result: CommentType;
        if (existingComment) {
          result = await updateMicroPostComment(existingComment.id, values.content) as CommentType;
          toast({ title: "Comment updated" });
        } else {
          result = await createMicroPostComment(postId, values.content, parentId) as CommentType;
          toast({ title: parentId ? "Reply posted" : "Comment posted" });
        }
        onCommentCreated(result);
        form.reset({ content: '' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  return (
    <div className='flex items-start gap-4'>
       {!parentId && ( // Only show avatar for top-level comments
        <Avatar className='mt-2 h-8 w-8'>
          <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
          <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      )}
      <div className="w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={parentId ? "Write a reply..." : "Add a comment..."}
                      className="resize-none bg-muted/50 border-border/50 rounded-md focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 p-2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end gap-2'>
              {onCancel && (
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {existingComment ? "Save" : "Post"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

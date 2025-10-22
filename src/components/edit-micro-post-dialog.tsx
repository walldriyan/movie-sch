
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateMicroPost, getAllCategories, getAllTags } from '@/lib/actions';
import type { MicroPost, User, MicroPostImage, Category, Tag } from '@prisma/client';
import { CategoryInput } from '@/components/manage/category-input';
import { TagInput } from '@/components/manage/tag-input';

type MicroPostWithRelations = MicroPost & {
    author: User;
    images: MicroPostImage[];
    categories: Category[];
    tags: Tag[];
};

const editSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty.').max(500, 'Post cannot exceed 500 characters.'),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

interface EditMicroPostDialogProps {
  post: MicroPostWithRelations;
  children: React.ReactNode;
  onUpdate: (updatedPost: MicroPostWithRelations) => void;
}

export default function EditMicroPostDialog({ post, children, onUpdate }: EditMicroPostDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, startTransition] = useTransition();
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

   useEffect(() => {
    if (isOpen) {
        const fetchInitialData = async () => {
            try {
                const [categoriesData, tagsData] = await Promise.all([
                    getAllCategories(),
                    getAllTags(),
                ]);
                setAllCategories(categoriesData.map(c => c.name));
                setAllTags(tagsData.map(t => t.name));
            } catch (error) {
                console.error("Failed to fetch categories/tags", error);
            }
        };
        fetchInitialData();
    }
  }, [isOpen]);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      content: post.content,
      categories: post.categories.map(c => c.name),
      tags: post.tags.map(t => t.name),
    },
  });

  const onSubmit = (values: EditFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('content', values.content);
      if (values.categories) formData.append('categories', values.categories.join(','));
      if (values.tags) formData.append('tags', values.tags.join(','));

      try {
        const updatedPostData = await updateMicroPost(post.id, formData);
        // We need to reconstruct the relations as the server action only returns the direct model
        const updatedPostWithRelations = {
            ...post,
            ...updatedPostData,
            content: values.content,
            categories: values.categories?.map(name => ({ id: name, name })) || [],
            tags: values.tags?.map(name => ({ id: name, name })) || [],
        };
        onUpdate(updatedPostWithRelations as MicroPostWithRelations);
        toast({ title: 'Success', description: 'Your post has been updated.' });
        setIsOpen(false);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Make changes to your post here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder="What's happening?"
                        rows={4}
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Categories</FormLabel>
                        <FormControl>
                            <CategoryInput
                                allCategories={allCategories}
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Add categories..."
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                            <TagInput
                                allTags={allTags}
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Add tags..."
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</> : <><Save className="mr-2 h-4 w-4"/>Save</>}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

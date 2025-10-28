
'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, X, Info } from 'lucide-react';
import type { User, MicroPost as MicroPostType } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from "@/components/ui/card";
import { createMicroPost, getAllCategories, getAllTags, getMicroPostCreationStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { CategoryInput } from '@/components/manage/category-input';
import { TagInput } from '@/components/manage/tag-input';
import MicroPostCard from './micro-post-card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Skeleton } from './ui/skeleton';


interface WallClientProps {
    initialMicroPosts: any[];
}

const microPostSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty.').max(2000, 'Post cannot exceed 2000 characters.'),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  image: z.instanceof(File).optional()
    .refine(file => !file || file.size <= 1024 * 1024, 'Image must be less than 1MB.'),
});

type MicroPostFormValues = z.infer<typeof microPostSchema>;


function CreateMicroPost({ onPostCreated }: { onPostCreated: (newPost: any) => void }) {
    const { data: session } = useSession();
    const user = session?.user;
    const { toast } = useToast();
    const [isSubmitting, startTransition] = useTransition();
    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [postStatus, setPostStatus] = useState<{ limit: number; count: number; remaining: number } | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    const fetchPostStatus = async () => {
        try {
            setIsLoadingStatus(true);
            const statusData = await getMicroPostCreationStatus();
            setPostStatus(statusData);
        } catch (error) {
            console.error("Failed to fetch post status:", error);
        } finally {
            setIsLoadingStatus(false);
        }
    }

    useEffect(() => {
        fetchPostStatus();
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
    }, []);

    const form = useForm<MicroPostFormValues>({
      resolver: zodResolver(microPostSchema),
      defaultValues: {
        content: '',
        categories: [],
        tags: [],
        image: undefined,
      }
    });

    const contentValue = form.watch('content');

    const userAvatar = user?.image || PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

    if (!user) return null;
    
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.size > 1024 * 1024) { // 1MB limit
          toast({ variant: 'destructive', title: 'File too large', description: 'Image size must be less than 1MB.'});
          return;
        }
        form.setValue('image', file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    
    const removeImage = () => {
        setPreviewImage(null);
        form.setValue('image', undefined);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const onSubmit = (values: MicroPostFormValues) => {
      startTransition(async () => {
        const formData = new FormData();
        formData.append('content', values.content);
        if (values.categories) formData.append('categories', values.categories.join(','));
        if (values.tags) formData.append('tags', values.tags.join(','));
        if (values.image) formData.append('image', values.image);

        try {
          const newPost = await createMicroPost(formData);
          onPostCreated(newPost);
          toast({ title: 'Success', description: 'Your post has been published.' });
          form.reset();
          setPreviewImage(null);
          await fetchPostStatus(); // Refresh status after posting
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
      });
    }
    
    const canPost = postStatus ? postStatus.remaining > 0 || postStatus.limit === 0 : false;
    const maxChars = 2000;

    return (
        <Card className="mb-8">
            <CardContent className="p-4">
               <div className="mb-4">
                {isLoadingStatus ? (
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="space-y-2 flex-grow">
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                ) : postStatus ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-sm text-muted-foreground">Daily Micro-Post Status</AlertTitle>
                    <AlertDescription>
                      Your daily limit is {postStatus.limit === 0 ? 'unlimited' : `${postStatus.limit} posts`}. 
                      You have created {postStatus.count} posts today. 
                      {postStatus.limit > 0 && ` You can create ${postStatus.remaining} more posts.`}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={userAvatar} />
                        <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="w-full space-y-4">
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                    placeholder="What's happening?"
                                    className="w-full bg-transparent border-input focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 p-2 text-base"
                                    rows={2}
                                    {...field}
                                    disabled={!canPost || isSubmitting}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         {previewImage && (
                          <div className="relative w-48 h-32 border rounded-md">
                            <Image src={previewImage} alt="Image preview" fill className="object-cover rounded-md" />
                            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <FormField
                            control={form.control}
                            name="categories"
                            render={({ field }) => (
                                <FormItem>
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
                        <div className="flex justify-between items-center pt-2">
                            <div className="flex gap-1 text-muted-foreground items-center">
                                <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} disabled={!canPost || isSubmitting}>
                                  <ImageIcon className="h-5 w-5" />
                                </Button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <div className="text-xs text-muted-foreground ml-2">
                                  <span>{contentValue.length}</span> / <span>{maxChars}</span>
                                </div>
                            </div>
                            <Button type="submit" disabled={isSubmitting || !canPost}>
                              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Post
                            </Button>
                        </div>
                    </div>
                  </form>
                </Form>
            </CardContent>
        </Card>
    );
}

export default function WallClient({ initialMicroPosts }: WallClientProps) {
    const [posts, setPosts] = useState(initialMicroPosts);

    const handlePostCreated = (newPost: any) => {
        // Since getMicroPosts fetches the full related data, we can just add the new post
        // to the top of the list.
        setPosts(currentPosts => [newPost, ...currentPosts]);
    };
    
    return (
        <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <CreateMicroPost onPostCreated={handlePostCreated} />
            <div className="space-y-8">
                {posts.length > 0 ? (
                    posts.map(post => <MicroPostCard key={post.id} post={post} />)
                ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h1 className="font-serif text-2xl font-bold text-muted-foreground">
                        The Wall is Quiet...
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Be the first to post something!
                    </p>
                    </div>
                )}
            </div>
        </main>
    );
}

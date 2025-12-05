
'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, X, Info, MessageSquare, Sparkles } from 'lucide-react';
import type { User, MicroPost as MicroPostType, MicroPost } from '@/lib/types';
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
import { Skeleton } from './ui/skeleton';


interface WallClientProps {
  initialMicroPosts: MicroPost[];
}

const microPostSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty.').max(2000, 'Post cannot exceed 2000 characters.'),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  image: z.instanceof(File).optional()
    .refine(file => !file || file.size <= 1024 * 1024, 'Image must be less than 1MB.'),
});

type MicroPostFormValues = z.infer<typeof microPostSchema>;


function CreateMicroPost({ onPostCreated }: { onPostCreated: (newPost: MicroPost) => void }) {
  const { data: session } = useSession();
  const user = session?.user;
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
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
        toast({ variant: 'destructive', title: 'File too large', description: 'Image size must be less than 1MB.' });
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
    if (fileInputRef.current) {
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
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'; // Reset height
        }
        await fetchPostStatus(); // Refresh status after posting
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  }

  const canPost = postStatus ? postStatus.remaining > 0 || postStatus.limit === 0 : false;
  const maxChars = 2000;

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5 mb-6">
      {/* Status Badge */}
      {isLoadingStatus ? (
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-48" />
        </div>
      ) : postStatus && (
        <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
          <Info className="h-3 w-3" />
          <span>
            {postStatus.limit === 0 ? 'Unlimited posts' : `${postStatus.remaining} of ${postStatus.limit} posts remaining today`}
          </span>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarImage src={userAvatar} />
            <AvatarFallback className="bg-white/5 text-white/60">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="w-full space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      ref={(e) => {
                        field.ref(e);
                        textareaRef.current = e;
                      }}
                      placeholder="What's on your mind?"
                      className="w-full bg-transparent border-0 focus-visible:ring-0 p-0 text-base text-white placeholder:text-white/30 resize-none"
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
              <div className="relative w-full max-w-xs aspect-video rounded-lg overflow-hidden border border-white/10">
                <Image src={previewImage} alt="Image preview" fill className="object-cover" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4 text-white" />
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
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <div className="flex gap-2 items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canPost || isSubmitting}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <span className="text-xs text-white/30">
                  {contentValue.length}/{maxChars}
                </span>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting || !canPost}
                className="rounded-md bg-white/[0.03] hover:bg-white/[0.06] text-white/70 hover:text-white border-0 h-8 px-4"
              >
                {isSubmitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Post
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

function WallSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl bg-white/[0.02] border border-white/5 p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-grow space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="aspect-video w-full rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function WallClient({ initialMicroPosts }: WallClientProps) {
  const [posts, setPosts] = useState<MicroPost[]>(initialMicroPosts);

  const handlePostCreated = (newPost: MicroPost) => {
    // Since getMicroPosts fetches the full related data, we can just add the new post
    // to the top of the list.
    setPosts(currentPosts => [newPost, ...currentPosts]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative pt-20 pb-8">
        {/* Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-56 h-56 bg-purple-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-xl mx-auto px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 mb-4">
            <MessageSquare className="w-4 h-4 text-white/60" />
            <span className="text-xs font-medium text-white/60">Community Feed</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            The Wall
          </h1>
          <p className="text-white/50 text-sm max-w-md">
            Share your thoughts with the community
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-xl mx-auto px-4 pb-12">
        <CreateMicroPost onPostCreated={handlePostCreated} />
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map(post => <MicroPostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center py-16 rounded-xl bg-white/[0.02] border border-white/5">
              <Sparkles className="h-12 w-12 mx-auto text-white/20 mb-4" />
              <h2 className="text-xl font-semibold text-white/70 mb-2">
                The Wall is Quiet...
              </h2>
              <p className="text-sm text-white/40">
                Be the first to share something!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

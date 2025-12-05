
'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, X, MessageSquare, Sparkles, Send, Hash, Folder } from 'lucide-react';
import type { MicroPost } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createMicroPost, getAllCategories, getAllTags, getMicroPostCreationStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormField, FormItem } from './ui/form';
import { CategoryInput } from '@/components/manage/category-input';
import { TagInput } from '@/components/manage/tag-input';
import MicroPostCard from './micro-post-card';
import { Badge } from './ui/badge';


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
  const categoriesValue = form.watch('categories') || [];
  const tagsValue = form.watch('tags') || [];

  const userAvatar = user?.image || PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  if (!user) return null;

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
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
          textareaRef.current.style.height = 'auto';
        }
        await fetchPostStatus();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  }

  const canPost = postStatus ? postStatus.remaining > 0 || postStatus.limit === 0 : false;
  const maxChars = 2000;

  return (
    <div className="rounded-xl border border-white/[0.06] overflow-hidden mb-6">
      {/* Status Bar */}
      {!isLoadingStatus && postStatus && (
        <div className="px-5 py-3 border-b border-white/[0.06] text-xs text-white/40">
          {postStatus.limit === 0
            ? '✨ Unlimited posts'
            : `📊 ${postStatus.remaining}/${postStatus.limit} posts remaining`}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={userAvatar} />
              <AvatarFallback className="bg-white/[0.06] text-white/50">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        ref={(e) => {
                          field.ref(e);
                          textareaRef.current = e;
                        }}
                        placeholder="What's on your mind?"
                        className="w-full bg-transparent border-0 focus-visible:ring-0 p-0 text-[15px] text-white placeholder:text-white/25 resize-none min-h-[80px]"
                        disabled={!canPost || isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Image Preview */}
              {previewImage && (
                <div className="relative w-full max-w-xs aspect-video rounded-lg overflow-hidden mt-3">
                  <Image src={previewImage} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center"
                    onClick={removeImage}
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              )}

              {/* Selected Categories & Tags Display */}
              {(categoriesValue.length > 0 || tagsValue.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {categoriesValue.map((cat) => (
                    <Badge key={cat} variant="secondary" className="bg-white/[0.06] text-white/60 border-0 text-xs">
                      <Folder className="h-3 w-3 mr-1" />{cat}
                    </Badge>
                  ))}
                  {tagsValue.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-white/[0.06] text-white/60 border-0 text-xs">
                      <Hash className="h-3 w-3 mr-1" />{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Hidden Category/Tag Inputs - still functional but not visible */}
              <div className="hidden">
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <CategoryInput
                      allCategories={allCategories}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Categories"
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <TagInput
                      allTags={allTags}
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Tags"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="h-9 w-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canPost || isSubmitting}
              >
                <ImageIcon className="h-[18px] w-[18px] text-white/40" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />

              <span className="text-[11px] text-white/25 ml-2">
                {contentValue.length}/{maxChars}
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !canPost || contentValue.length === 0}
              size="sm"
              className="rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white/80 hover:text-white border-0 h-9 px-4 gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Post</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function WallClient({ initialMicroPosts }: WallClientProps) {
  const [posts, setPosts] = useState<MicroPost[]>(initialMicroPosts);

  const handlePostCreated = (newPost: MicroPost) => {
    setPosts(currentPosts => [newPost, ...currentPosts]);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="pt-20 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] text-white/40 text-xs mb-4">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Community Feed</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">The Wall</h1>
        <p className="text-white/35 text-sm">Share your thoughts with the community</p>
      </div>

      {/* Content - Centered */}
      <div className="w-full max-w-xl mx-auto px-4 pb-12">
        <CreateMicroPost onPostCreated={handlePostCreated} />

        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map(post => <MicroPostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center py-16 rounded-xl border border-white/[0.06]">
              <Sparkles className="h-8 w-8 text-white/15 mx-auto mb-4" />
              <p className="text-white/50 font-medium">The Wall is Quiet...</p>
              <p className="text-white/30 text-sm mt-1">Be the first to share!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


'use client';

import React, { useState, useTransition, useEffect, useRef, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Image as ImageIcon, X, MessageSquare, Sparkles, Send,
  Heart, MessageCircle, Bookmark, MoreHorizontal, Search,
  Clock, TrendingUp, Trash2, Plus, PenLine
} from 'lucide-react';
import type { MicroPost } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createMicroPost, getAllTags, toggleMicroPostLike, deleteMicroPost } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Textarea } from './ui/textarea';
import { Form, FormControl, FormField, FormItem } from './ui/form';
import { TagInput } from '@/components/manage/tag-input';
import { Input } from './ui/input';
import Link from 'next/link';
import ClientRelativeDate from './client-relative-date';
import { cn } from '@/lib/utils';
import { ROLES } from '@/lib/permissions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
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
} from './ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import MicroPostComments from './micro-post-comments';


interface WallClientProps {
  initialMicroPosts: MicroPost[];
}

const microPostSchema = z.object({
  content: z.string().min(1, 'Content required').max(2000),
  tags: z.array(z.string()).optional(),
  image: z.instanceof(File).optional()
    .refine(file => !file || file.size <= 1024 * 1024, 'Max 1MB'),
});

type MicroPostFormValues = z.infer<typeof microPostSchema>;

const TIME_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];


// ========================================
// POST CARD COMPONENT
// ========================================
function PostCard({ post: initialPost, onDelete }: { post: MicroPost; onDelete: (id: string) => void }) {
  const { data: session } = useSession();
  const user = session?.user;
  const { toast } = useToast();
  const [post, setPost] = useState(initialPost);
  const [isLikePending, startLikeTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  const postImage = post.images?.[0]?.url;
  const hasLiked = post.likes?.some(like => like.userId === user?.id) ?? false;
  const likeCount = post._count?.likes || 0;
  const commentCount = post._count?.comments || 0;
  const canManage = user && (user.id === post.authorId || user.role === ROLES.SUPER_ADMIN);

  const handleLike = () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please log in to like' });
      return;
    }
    startLikeTransition(async () => {
      const newLikeCount = hasLiked ? likeCount - 1 : likeCount + 1;
      const newLikes = hasLiked
        ? post.likes.filter(like => like.userId !== user.id)
        : [...post.likes, { userId: user.id, microPostId: post.id, id: '', createdAt: new Date() }];
      setPost(p => ({ ...p, likes: newLikes, _count: { ...p._count, likes: newLikeCount } }));
      try {
        await toggleMicroPostLike(post.id);
      } catch {
        setPost(initialPost);
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deleteMicroPost(post.id);
        onDelete(post.id);
        toast({ title: 'Post deleted' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  const handleCommentCountChange = useCallback((count: number) => {
    setPost(p => ({ ...p, _count: { ...p._count, comments: count } }));
  }, []);

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={post.author.image || ''} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-white/80 text-sm">
              {post.author.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-white text-sm">{post.author.name}</p>
            <span className="text-[11px] text-white/40 block">
              <ClientRelativeDate date={post.createdAt} />
            </span>
          </div>
        </Link>

        {canManage && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white/60">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-red-400">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete post?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeletePending} className="bg-red-500 hover:bg-red-600">
                  {isDeletePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-white/80 text-[14px] whitespace-pre-wrap leading-relaxed">{post.content}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map(tag => (
              <span key={tag.id} className="text-[11px] text-purple-400">#{tag.name}</span>
            ))}
          </div>
        )}
      </div>

      {/* Image */}
      {postImage && (
        <div className="relative aspect-[16/9] mx-4 mb-3 rounded-lg overflow-hidden">
          <Image src={postImage} alt="Post" fill className="object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-3">
        <Accordion type="single" collapsible>
          <AccordionItem value="comments" className="border-0">
            <div className="flex items-center gap-5 py-2 border-t border-white/[0.05]">
              <button
                onClick={handleLike}
                disabled={isLikePending}
                className={cn(
                  "flex items-center gap-1.5 transition-colors",
                  hasLiked ? "text-red-400" : "text-white/40 hover:text-red-400"
                )}
              >
                <Heart className={cn("h-[18px] w-[18px]", hasLiked && "fill-current")} />
                {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
              </button>

              <AccordionTrigger className="p-0 hover:no-underline [&>svg]:hidden">
                <div className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors">
                  <MessageCircle className="h-[18px] w-[18px]" />
                  {commentCount > 0 && <span className="text-xs">{commentCount}</span>}
                </div>
              </AccordionTrigger>

              <button className="text-white/40 hover:text-white/70 transition-colors ml-auto">
                <Bookmark className="h-[18px] w-[18px]" />
              </button>
            </div>

            <AccordionContent className="pt-2">
              <MicroPostComments postId={post.id} onCommentCountChange={handleCommentCountChange} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}


// ========================================
// CREATE POST DIALOG
// ========================================
function CreatePostDialog({ onPostCreated }: { onPostCreated: (post: MicroPost) => void }) {
  const { data: session } = useSession();
  const user = session?.user;
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsData = await getAllTags();
        setAllTags(tagsData.map(t => t.name));
      } catch (error) {
        console.error("Failed to fetch tags", error);
      }
    };
    fetchTags();
  }, []);

  const form = useForm<MicroPostFormValues>({
    resolver: zodResolver(microPostSchema),
    defaultValues: { content: '', tags: [], image: undefined }
  });

  const contentValue = form.watch('content');
  const userAvatar = user?.image || PlaceHolderImages.find(img => img.id === 'avatar-4')?.imageUrl;

  if (!user) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File too large' });
        return;
      }
      form.setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    form.setValue('image', undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (values: MicroPostFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('content', values.content);
      if (values.tags) formData.append('tags', values.tags.join(','));
      if (values.image) formData.append('image', values.image);

      try {
        const newPost = await createMicroPost(formData);
        onPostCreated(newPost);
        toast({ title: 'Posted!' });
        form.reset();
        setPreviewImage(null);
        setOpen(false);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="group cursor-pointer rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] p-5 transition-all hover:bg-white/[0.04]">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <PenLine className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Share a thought</h3>
              <p className="text-[12px] text-white/40">Write something to the community</p>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <span className="text-xs text-white/30 group-hover:text-purple-400 transition-colors">Create →</span>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userAvatar} />
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="What's on your mind?"
                        className="min-h-[120px] resize-none"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {previewImage && (
              <div className="relative w-28 h-28 rounded-lg overflow-hidden">
                <Image src={previewImage} alt="" fill className="object-cover" />
                <button
                  type="button"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            )}

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
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                <span className="text-xs text-muted-foreground">{contentValue.length}/2000</span>
              </div>

              <Button type="submit" disabled={isSubmitting || contentValue.length === 0} className="gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


// ========================================
// MAIN WALL COMPONENT
// ========================================
export default function WallClient({ initialMicroPosts }: WallClientProps) {
  const [posts, setPosts] = useState<MicroPost[]>(initialMicroPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  const handlePostCreated = (newPost: MicroPost) => {
    setPosts(current => [newPost, ...current]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(current => current.filter(p => p.id !== postId));
  };

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post =>
        post.content.toLowerCase().includes(query) ||
        post.author.name?.toLowerCase().includes(query) ||
        post.tags?.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    if (timeFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter(post => {
        const postDate = new Date(post.createdAt);
        switch (timeFilter) {
          case 'today': return postDate >= startOfToday;
          case 'week': return postDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          case 'month': return postDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          default: return true;
        }
      });
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, searchQuery, timeFilter]);

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col">
      {/* Fixed Hero Section */}
      <div className="flex-shrink-0 pt-16 pb-8 text-center relative">
        {/* Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/[0.08] rounded-full blur-[100px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-pink-500/[0.05] rounded-full blur-[80px]" />
        </div>

        <div className="relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/60 text-xs mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Share Something New</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            <span className="text-white">What would you like to </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              share today
            </span>
            <span className="text-white">?</span>
          </h1>

          {/* Description */}
          <p className="text-white/50 text-sm md:text-base max-w-lg mx-auto mb-8">
            Connect with the community. Share your thoughts, ideas, or discoveries.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              type="text"
              placeholder="Search posts, users, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 bg-white/[0.03] border-white/[0.08] rounded-xl"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {TIME_FILTERS.map(filter => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                  timeFilter === filter.value
                    ? "bg-white/[0.1] text-white"
                    : "text-white/40 hover:text-white/60"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Posts Container */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          {/* Create Card + Posts Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Create Post Card */}
            <CreatePostDialog onPostCreated={handlePostCreated} />

            {/* Posts */}
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <PostCard key={post.id} post={post} onDelete={handlePostDeleted} />
              ))
            ) : (
              <div className="md:col-span-2 lg:col-span-2 text-center py-16 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <MessageSquare className="h-10 w-10 text-white/15 mx-auto mb-4" />
                <p className="text-white/50 font-medium">
                  {searchQuery ? 'No posts found' : 'No posts yet'}
                </p>
                <p className="text-white/30 text-sm mt-1">
                  {searchQuery ? 'Try different keywords' : 'Be the first to share!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

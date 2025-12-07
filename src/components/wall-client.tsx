
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
import { createMicroPost, getAllTags, toggleMicroPostLike, deleteMicroPost } from '@/lib/actions/microposts';
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


// Default placeholder images for posts without images
const DEFAULT_POST_IMAGES = [
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80', // cinema
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80', // theater
  'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80', // film
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80', // projector
  'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&q=80', // popcorn
  'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=800&q=80', // movie set
];

// Get consistent random image based on post id
const getDefaultImage = (postId: string) => {
  const hash = postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_POST_IMAGES[hash % DEFAULT_POST_IMAGES.length];
};

// ========================================
// POST CARD COMPONENT - Suno.com Style Bento Card
// ========================================
function PostCard({ post: initialPost, onDelete, variant = 'normal' }: {
  post: MicroPost;
  onDelete: (id: string) => void;
  variant?: 'featured' | 'normal' | 'compact';
}) {
  const { data: session } = useSession();
  const user = session?.user;
  const { toast } = useToast();
  const [post, setPost] = useState(initialPost);
  const [isLikePending, startLikeTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [showComments, setShowComments] = useState(false);

  const postImage = post.images?.[0]?.url || getDefaultImage(post.id);
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

  // Card height based on variant
  const cardHeight = variant === 'featured' ? 'h-[380px]' : variant === 'compact' ? 'h-[200px]' : 'h-[280px]';

  return (
    <div className={cn(
      "group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
      "hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10",
      cardHeight
    )}>
      {/* Background Image */}
      <Image
        src={postImage}
        alt="Post"
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Top Section - Author & Actions */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between">
        {/* Author Avatar Group */}
        <Link href={`/profile/${post.author.id}`} className="flex items-center gap-2 group/avatar">
          <div className="flex -space-x-2">
            <Avatar className="h-8 w-8 border-2 border-black/50">
              <AvatarImage src={post.author.image || ''} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                {post.author.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="text-white/80 text-xs font-medium opacity-0 group-hover:opacity-100 group-hover/avatar:opacity-100 transition-opacity">
            {post.author.name}
          </span>
        </Link>

        {/* More Actions */}
        {canManage && (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
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

      {/* Bottom Section - Content & Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {post.tags.slice(0, 3).map(tag => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-[10px] text-white/80 font-medium"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Content/Title */}
        <p className={cn(
          "text-white font-semibold leading-snug mb-2",
          variant === 'featured' ? 'text-lg line-clamp-3' : 'text-sm line-clamp-2'
        )}>
          {post.content}
        </p>

        {/* Date & Stats */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/50">
            <ClientRelativeDate date={post.createdAt} />
          </span>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
              disabled={isLikePending}
              className={cn(
                "flex items-center gap-1 transition-colors",
                hasLiked ? "text-red-400" : "text-white/50 hover:text-red-400"
              )}
            >
              <Heart className={cn("h-4 w-4", hasLiked && "fill-current")} />
              {likeCount > 0 && <span className="text-[11px]">{likeCount}</span>}
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
              className="flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              {commentCount > 0 && <span className="text-[11px]">{commentCount}</span>}
            </button>

            <button className="text-white/50 hover:text-white/80 transition-colors">
              <Bookmark className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Comments Overlay */}
      {showComments && (
        <div
          className="absolute inset-0 bg-black/95 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Comments</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowComments(false)}
              className="h-8 w-8 text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <MicroPostComments postId={post.id} onCommentCountChange={handleCommentCountChange} />
        </div>
      )}
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
        <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-full h-10 px-5">
          <Plus className="h-4 w-4" />
          Create Post
        </Button>
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
// STORY CARD COMPONENT
// ========================================
function StoryCard({ post }: { post: MicroPost }) {
  const postImage = post.images?.[0]?.url;

  return (
    <div className="flex-shrink-0 w-20 group cursor-pointer">
      <div className="relative w-16 h-16 mx-auto rounded-full p-[2px] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
        <div className="w-full h-full rounded-full overflow-hidden bg-background">
          <Avatar className="w-full h-full">
            <AvatarImage src={post.author.image || ''} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-white/80 text-sm">
              {post.author.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
        {postImage && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background overflow-hidden">
            <Image src={postImage} alt="" fill className="object-cover" />
          </div>
        )}
      </div>
      <p className="text-[11px] text-white/60 text-center mt-2 truncate group-hover:text-white/80 transition-colors">
        {post.author.name?.split(' ')[0] || 'User'}
      </p>
    </div>
  );
}


// ========================================
// MAIN WALL COMPONENT
// ========================================
export default function WallClient({ initialMicroPosts }: WallClientProps) {
  const [posts, setPosts] = useState<MicroPost[]>(initialMicroPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  const handlePostCreated = (newPost: MicroPost) => {
    setPosts(current => [newPost, ...current]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(current => current.filter(p => p.id !== postId));
  };

  // Get unique authors for story cards (max 10)
  const storyAuthors = useMemo(() => {
    const seen = new Set<string>();
    return posts.filter(post => {
      if (seen.has(post.authorId)) return false;
      seen.add(post.authorId);
      return true;
    }).slice(0, 10);
  }, [posts]);

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

    // Sort
    if (sortBy === 'popular') {
      return result.sort((a, b) => (b._count?.likes || 0) - (a._count?.likes || 0));
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, searchQuery, timeFilter, sortBy]);

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col">
      {/* Compact Hero Section - 200px height */}
      <div className="flex-shrink-0 h-[200px] relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-pink-900/10 to-purple-900/20" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[200px] bg-purple-500/[0.1] rounded-full blur-[80px]" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[250px] h-[150px] bg-pink-500/[0.08] rounded-full blur-[60px]" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center px-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/60 text-[11px] mb-3">
            <Sparkles className="w-3 h-3" />
            <span>Community Wall</span>
          </div>

          {/* Compact Headline */}
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">
            <span className="text-white">Share with the </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Community
            </span>
          </h1>

          {/* Create Button */}
          <CreatePostDialog onPostCreated={handlePostCreated} />
        </div>
      </div>

      {/* Story Cards Bar */}
      {storyAuthors.length > 0 && (
        <div className="flex-shrink-0 px-4 py-4 border-b border-white/[0.05]">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
              {/* Add Story Card */}
              <div className="flex-shrink-0 w-20 group cursor-pointer">
                <div className="relative w-16 h-16 mx-auto rounded-full bg-white/[0.05] border-2 border-dashed border-white/[0.15] flex items-center justify-center hover:border-purple-500/50 transition-colors">
                  <Plus className="w-6 h-6 text-white/40 group-hover:text-purple-400 transition-colors" />
                </div>
                <p className="text-[11px] text-white/40 text-center mt-2">Your story</p>
              </div>

              {/* Story Cards */}
              {storyAuthors.map(post => (
                <StoryCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar - Like Home Page */}
      <div className="flex-shrink-0 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.06] p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  type="text"
                  placeholder="Search posts, users, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 bg-white/[0.03] border-white/[0.08] rounded-lg text-sm"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {TIME_FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setTimeFilter(filter.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                      timeFilter === filter.value
                        ? "bg-white/[0.1] text-white"
                        : "text-white/40 hover:text-white/60 hover:bg-white/[0.05]"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}

                {/* Separator */}
                <div className="w-px h-4 bg-white/[0.1] mx-1" />

                {/* Sort Options */}
                <button
                  onClick={() => setSortBy('latest')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    sortBy === 'latest'
                      ? "bg-purple-500/20 text-purple-400"
                      : "text-white/40 hover:text-white/60 hover:bg-white/[0.05]"
                  )}
                >
                  <Clock className="w-3 h-3" />
                  Latest
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    sortBy === 'popular'
                      ? "bg-pink-500/20 text-pink-400"
                      : "text-white/40 hover:text-white/60 hover:bg-white/[0.05]"
                  )}
                >
                  <TrendingUp className="w-3 h-3" />
                  Popular
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Posts Feed - Masonry Bento Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
              {filteredPosts.map((post, index) => {
                // Determine card variant based on position for visual variety
                let variant: 'featured' | 'normal' | 'compact' = 'normal';
                if (index === 0) variant = 'featured'; // First post is featured
                else if (index % 5 === 4) variant = 'compact'; // Every 5th post is compact
                else if (index % 7 === 0 && index > 0) variant = 'featured'; // Every 7th post is featured

                // Make featured cards span 2 columns on larger screens
                const spanClass = variant === 'featured' ? 'sm:col-span-2 lg:col-span-1 lg:row-span-1' : '';

                return (
                  <div key={post.id} className={spanClass}>
                    <PostCard post={post} onDelete={handlePostDeleted} variant={variant} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
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
  );
}

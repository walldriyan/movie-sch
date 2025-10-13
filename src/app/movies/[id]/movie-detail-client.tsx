'use client';

import React, { useTransition, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Star,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Share2,
  ListVideo,
  Tag,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  Home,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Post as PostType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toggleLikePost, toggleFavoritePost, deletePost } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ROLES } from '@/lib/permissions';
import { Skeleton } from '@/components/ui/skeleton';

export default function MovieDetailClient({
  post,
  setPost,
  children,
}: {
  post: PostType;
  setPost: React.Dispatch<React.SetStateAction<PostType>>;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const currentUser = session?.user;

  const [isLikeTransitioning, startLikeTransition] = useTransition();
  const [isFavoritePending, startFavoriteTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('about');
  
  const heroImage = post.posterUrl || PlaceHolderImages.find((img) => img.id === 'movie-poster-placeholder')?.imageUrl;
  const authorAvatarUrl = post.author.image || PlaceHolderImages.find((img) => img.id === 'avatar-1')?.imageUrl;

  const tabButtonStyle = 'flex items-center gap-2 cursor-pointer transition-colors hover:text-foreground pb-3 border-b-2 whitespace-nowrap';
  const activeTabButtonStyle = 'text-primary font-semibold border-primary';
  const inactiveTabButtonStyle = 'border-transparent';
  
  const handleLike = (likeAction: 'like' | 'dislike') => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to like or dislike a post.',
      });
      return;
    }

    const originalPost = post;
    const currentIsLiked = post.likedBy?.some(user => user.id === currentUser.id);
    const currentIsDisliked = post.dislikedBy?.some(user => user.id === currentUser.id);

    let optimisticPost: PostType = { ...post };

    if (likeAction === 'like') {
      optimisticPost = {
        ...optimisticPost,
        likedBy: currentIsLiked 
          ? optimisticPost.likedBy?.filter(u => u.id !== currentUser.id) 
          : [...(optimisticPost.likedBy || []), currentUser as any],
        dislikedBy: currentIsDisliked 
          ? optimisticPost.dislikedBy?.filter(u => u.id !== currentUser.id) 
          : optimisticPost.dislikedBy,
      };
    } else {
      optimisticPost = {
        ...optimisticPost,
        dislikedBy: currentIsDisliked 
          ? optimisticPost.dislikedBy?.filter(u => u.id !== currentUser.id) 
          : [...(optimisticPost.dislikedBy || []), currentUser as any],
        likedBy: currentIsLiked 
          ? optimisticPost.likedBy?.filter(u => u.id !== currentUser.id) 
          : optimisticPost.likedBy,
      };
    }
    
    optimisticPost._count = {
      ...optimisticPost._count,
      likedBy: optimisticPost.likedBy?.length || 0,
    };

    setPost(optimisticPost);

    startLikeTransition(() => {
      toggleLikePost(post.id, likeAction === 'like')
        .catch((err) => {
          setPost(originalPost);
          toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: err.message || "Could not update your preference.",
          });
        });
    });
  };

  const handleFavorite = () => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to add a post to favorites.',
      });
      return;
    }
    
    const wasFavorited = post.favoritePosts?.some(fav => fav.userId === currentUser.id);
    const originalPost = post;

    const optimisticPost = {
      ...post,
      favoritePosts: wasFavorited
        ? post.favoritePosts?.filter(fav => fav.userId !== currentUser.id)
        : [...(post.favoritePosts || []), { userId: currentUser.id, postId: post.id, createdAt: new Date() }]
    };
    
    setPost(optimisticPost);

    startFavoriteTransition(() => {
      toggleFavoritePost(post.id)
        .then(() => {
          toast({
            title: 'Favorites Updated',
            description: `Post has been ${wasFavorited ? 'removed from' : 'added to'} your favorites.`,
          });
        })
        .catch((err) => {
          setPost(originalPost);
          toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: err.message,
          });
        });
    });
  };
  
  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deletePost(post.id);
        toast({
          title: 'Post Deleted',
          description: `"${post.title}" has been submitted for deletion.`,
        });
        router.push('/manage');
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to delete post.',
        });
      }
    });
  };

  const isFavorited = currentUser && post.favoritePosts?.some(fav => fav.userId === currentUser.id);
  const isLiked = currentUser && post.likedBy?.some(user => user.id === currentUser.id);
  const isDisliked = currentUser && post.dislikedBy?.some(user => user.id === currentUser.id);
  const canManage = currentUser && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(currentUser.role);

  // Show loading state OR authenticated buttons OR nothing
  const showInteractiveButtons = sessionStatus === 'authenticated' && currentUser;
  const showLoadingState = sessionStatus === 'loading';

  return (
    <>
      <header className="relative h-[500px] w-full rounded-b-2xl overflow-hidden flex items-end">
        {heroImage && (
          <Image
            src={heroImage}
            alt={`Poster for ${post.title}`}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          asChild
          className="absolute top-4 left-16 z-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-white/20"
        >
          <Link href="/">
            <Home className="h-5 w-5" />
            <span className="sr-only">Home</span>
          </Link>
        </Button>

        <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-2 justify-end">
          {post.genres.map((genre: string) => (
            <Button key={genre} variant="outline" size="sm" className="rounded-full bg-black/20 backdrop-blur-sm border-white/20 hover:bg-white/20">
              <Tag className="mr-2 h-4 w-4" />
              {genre}
            </Button>
          ))}
        </div>

        <div className="relative z-10 text-foreground flex flex-col items-start text-left pb-0 w-full overflow-hidden pr-8">
          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-4 text-left">
            {post.title}
          </h1>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2.5">
            <Link href={`/profile/${post.author.id}`} className="flex items-center gap-4 group">
              <Avatar className='w-16 h-16'>
                {authorAvatarUrl && (
                  <AvatarImage
                    src={authorAvatarUrl}
                    alt={post.author.name || 'Author'}
                    data-ai-hint="person face"
                  />
                )}
                <AvatarFallback>{post.author.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-foreground group-hover:text-primary">
                  {post.author.name}
                </p>
                <div className="flex items-center gap-2">
                  <span>{post.year}</span>
                  <span>&middot;</span>
                  <span>{post.duration}</span>
                </div>
              </div>
            </Link>
          </div>

          <Separator className="my-4 bg-border/20" />
          <div className="flex items-center justify-between py-2 text-muted-foreground w-full overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-6 flex-shrink-0">
              <button
                onClick={() => setActiveTab('about')}
                className={cn(tabButtonStyle, activeTab === 'about' ? activeTabButtonStyle : inactiveTabButtonStyle)}
              >
                <Image src="/imdb.png" alt="IMDb" width={40} height={20} />
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-foreground">{post.imdbRating?.toFixed(1)}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={cn(tabButtonStyle, activeTab === 'reviews' ? activeTabButtonStyle : inactiveTabButtonStyle)}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-foreground">{post._count?.reviews ?? post.reviews.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('subtitles')}
                className={cn(tabButtonStyle, activeTab === 'subtitles' ? activeTabButtonStyle : inactiveTabButtonStyle)}
              >
                <ListVideo className="w-5 h-5" />
                <span className="text-foreground">Subtitles</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2 pl-4 flex-shrink-0">
              {showLoadingState && (
                <>
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-16" />
                </>
              )}
              
              {showInteractiveButtons && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleLike('like')} 
                    disabled={isLikeTransitioning} 
                    className={cn("px-3", isLiked && "bg-black/20 backdrop-blur-sm border border-white/20")}
                  >
                    <ThumbsUp className={cn("w-5 h-5", isLiked ? "text-foreground fill-foreground" : "text-muted-foreground")} />
                    <span className="text-sm w-4 text-left ml-2">{post._count?.likedBy ?? post.likedBy?.length ?? 0}</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleLike('dislike')} 
                    disabled={isLikeTransitioning} 
                    className={cn("px-3", isDisliked && "bg-black/20 backdrop-blur-sm border border-white/20")}
                  >
                    <ThumbsDown className={cn("w-5 h-5", isDisliked ? "text-foreground fill-foreground" : "text-muted-foreground")} />
                    <span className="text-sm w-4 text-left ml-2">{post.dislikedBy?.length ?? 0}</span>
                  </Button>
                </>
              )}

              <Separator orientation="vertical" className="h-6 mx-2" />

              <Button variant="ghost" size="icon" onClick={handleFavorite} disabled={!currentUser || isFavoritePending}>
                {isFavoritePending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Bookmark className={cn("w-5 h-5", isFavorited ? "text-foreground fill-foreground" : "text-muted-foreground")} />
                )}
              </Button>
              
              <Button variant="ghost" size="icon">
                <Share2 className="w-5 h-5 text-muted-foreground" />
              </Button>
              
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href={`/manage?edit=${post.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} className="mt-8">
        {children}
      </Tabs>
    </>
  );
}
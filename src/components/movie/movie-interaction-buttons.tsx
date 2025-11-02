
'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from 'next-auth';
import {
  Bookmark,
  MoreHorizontal,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { Post as PostType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toggleLikePost, toggleFavoritePost, deletePost } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ROLES } from '@/lib/permissions';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '../auth/auth-guard';


interface MovieInteractionButtonsProps {
    post: PostType;
    onPostUpdate: (updatedPost: PostType) => void;
    session: Session | null;
}

export default function MovieInteractionButtons({ post, onPostUpdate, session }: MovieInteractionButtonsProps) {
    const router = useRouter();
    const currentUser = session?.user;
    const sessionStatus = session ? 'authenticated' : 'unauthenticated';

    const [isLikeTransitioning, startLikeTransition] = useTransition();
    const [isFavoritePending, startFavoriteTransition] = useTransition();
    const [isDeleting, startDeleteTransition] = useTransition();
    const { toast } = useToast();

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
        dislikedBy: optimisticPost.dislikedBy?.length || 0,
        };

        onPostUpdate(optimisticPost as PostType);

        startLikeTransition(async () => {
            try {
                await toggleLikePost(post.id, likeAction === 'like');
            } catch (err: any) {
                onPostUpdate(originalPost as PostType);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: err.message || 'Failed to update your preference.'
                });
            }
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
        
        onPostUpdate(optimisticPost as PostType);

        startFavoriteTransition(async () => {
            try {
                await toggleFavoritePost(post.id);
                 toast({
                    title: 'Favorites Updated',
                    description: `Post has been ${wasFavorited ? 'removed from' : 'added to'} your favorites.`,
                });
            } catch (err: any) {
                onPostUpdate(originalPost as PostType);
                 toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: err.message || 'Failed to update favorites.'
                });
            }
        });
    };
    
    const handleDelete = () => {
        startDeleteTransition(async () => {
            await deletePost(post.id);
            toast({
            title: 'Post Deleted',
            description: `"${post.title}" has been submitted for deletion.`,
            });
            router.push('/manage');
        });
    };

    const isFavorited = currentUser && post.favoritePosts?.some(fav => fav.userId === currentUser.id);
    const isLiked = currentUser && post.likedBy?.some(user => user.id === currentUser.id);
    const isDisliked = currentUser && post.dislikedBy?.some(user => user.id === currentUser.id);
    
    const canManage = currentUser && (
        currentUser.id === post.authorId || 
        [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(currentUser.role)
    );
    
    const showInteractiveButtons = sessionStatus === 'authenticated' && currentUser;
    const showLoadingState = sessionStatus === 'loading';

    return (
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
                    <span className="text-sm w-4 text-left ml-2">{post._count?.likedBy ?? 0}</span>
                </Button>
                
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleLike('dislike')} 
                    disabled={isLikeTransitioning} 
                    className={cn("px-3", isDisliked && "bg-black/20 backdrop-blur-sm border border-white/20")}
                >
                    <ThumbsDown className={cn("w-5 h-5", isDisliked ? "text-foreground fill-foreground" : "text-muted-foreground")} />
                    <span className="text-sm w-4 text-left ml-2">{post._count?.dislikedBy ?? 0}</span>
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
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

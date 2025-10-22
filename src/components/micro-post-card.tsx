
'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ClientRelativeDate from '@/components/client-relative-date';
import { MessageCircle, Heart, Share2, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import type { MicroPost, User, MicroPostImage, Category, Tag, MicroPostLike } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { toggleMicroPostLike, deleteMicroPost } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ROLES } from '@/lib/permissions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { cn } from '@/lib/utils';
import EditMicroPostDialog from './edit-micro-post-dialog';

type MicroPostWithRelations = MicroPost & {
    author: User;
    images: MicroPostImage[];
    categories: Category[];
    tags: Tag[];
    likes: MicroPostLike[];
    _count: {
        likes: number;
        comments: number;
    };
};

interface MicroPostCardProps {
    post: MicroPostWithRelations;
}

export default function MicroPostCard({ post: initialPost }: MicroPostCardProps) {
    const { data: session } = useSession();
    const user = session?.user;
    const { toast } = useToast();
    const [post, setPost] = useState(initialPost);
    const [isLikePending, startLikeTransition] = useTransition();
    const [isDeletePending, startDeleteTransition] = useTransition();

    const postImage = post.images?.[0]?.url;
    const hasLiked = post.likes.some(like => like.userId === user?.id);

    const handleLike = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Please log in to like a post.' });
            return;
        }

        startLikeTransition(async () => {
             // Optimistic update
            const newLikeCount = hasLiked ? post._count.likes - 1 : post._count.likes + 1;
            const newLikes = hasLiked
                ? post.likes.filter(like => like.userId !== user.id)
                : [...post.likes, { userId: user.id, postId: post.id }];
            
            setPost(currentPost => ({
                ...currentPost,
                likes: newLikes,
                _count: { ...currentPost._count, likes: newLikeCount }
            }));

            try {
                await toggleMicroPostLike(post.id);
            } catch (error) {
                // Revert on error
                toast({ variant: 'destructive', title: 'Something went wrong.' });
                 setPost(initialPost);
            }
        });
    };

    const handleDelete = () => {
        startDeleteTransition(async () => {
            try {
                await deleteMicroPost(post.id);
                toast({ title: "Post Deleted" });
                // Note: The post will disappear from the feed on the next page refresh/revalidation
            } catch (error: any) {
                 toast({ variant: 'destructive', title: "Error", description: error.message });
            }
        })
    }

    const canManage = user && (user.id === post.authorId || user.role === ROLES.SUPER_ADMIN);

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start gap-4">
                    <Link href={`/profile/${post.author.id}`}>
                        <Avatar>
                            <AvatarImage src={post.author.image || ''} alt={post.author.name || ''} />
                            <AvatarFallback>{post.author.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                    </Link>

                    <div className="flex-grow">
                        <div className="flex items-center gap-2">
                            <Link href={`/profile/${post.author.id}`} className="font-semibold hover:underline">
                                {post.author.name}
                            </Link>
                            <span className="text-sm text-muted-foreground">·</span>
                            <ClientRelativeDate date={post.createdAt} />
                        </div>
                        
                        <p className="mt-2 whitespace-pre-wrap">{post.content}</p>

                        {postImage && (
                             <div className="mt-3 relative aspect-video max-h-[400px] w-full overflow-hidden rounded-xl border">
                                <Image 
                                    src={postImage} 
                                    alt="Post image" 
                                    fill
                                    className="object-cover"
                                />
                             </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                            {post.categories.map(category => (
                                <Badge key={category.id} variant="secondary">{category.name}</Badge>
                            ))}
                            {post.tags.map(tag => (
                                <Badge key={tag.id} variant="outline">#{tag.name}</Badge>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-between items-center text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MessageCircle className="h-4 w-4" />
                                </Button>
                                <span className="text-xs">{post._count.comments}</span>
                            </div>
                             <div className="flex items-center gap-1.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLike} disabled={isLikePending}>
                                    <Heart className={cn("h-4 w-4", hasLiked && "fill-red-500 text-red-500")} />
                                </Button>
                                <span className="text-xs">{post._count.likes}</span>
                            </div>
                             <div className="flex items-center gap-1.5">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                     {canManage && (
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <EditMicroPostDialog post={post} onUpdate={setPost}>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            <span>Edit</span>
                                        </DropdownMenuItem>
                                    </EditMicroPostDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your post.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} disabled={isDeletePending} className="bg-destructive hover:bg-destructive/80">
                                         {isDeletePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     )}
                </div>
            </CardContent>
        </Card>
    );
}


'use client';

import React, { useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ClientRelativeDate from '@/components/client-relative-date';
import { MessageCircle, Heart, Share2, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import type { MicroPost as MicroPostType, User, MicroPostImage, Category, Tag, MicroPostLike } from '@/lib/types';
import { useSession } from 'next-auth/react';
import { toggleMicroPostLike, deleteMicroPost } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ROLES } from '@/lib/permissions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { cn } from '@/lib/utils';
import EditMicroPostDialog from './edit-micro-post-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import MicroPostComments from './micro-post-comments';

type MicroPostWithRelations = MicroPostType;

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
    const hasLiked = post.likes?.some(like => like.userId === user?.id) ?? false;
    
    const likeCount = post?._count?.likes ?? 0;
    
    const handleCommentCountChange = useCallback((count: number) => {
        setPost(currentPost => {
            if (currentPost._count.comments === count) {
                return currentPost;
            }
            return {
                ...currentPost,
                _count: {
                    ...currentPost._count,
                    comments: count,
                },
            };
        });
    }, []);

    const commentCount = post?._count?.comments ?? 0;

    const handleLike = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Please log in to like a post.' });
            return;
        }

        startLikeTransition(async () => {
            const newLikeCount = hasLiked ? likeCount - 1 : likeCount + 1;
            const newLikes = hasLiked
                ? post.likes.filter(like => like.userId !== user.id)
                : [...post.likes, { userId: user.id, microPostId: post.id, id: '', createdAt: new Date() }];

            setPost(currentPost => ({
                ...currentPost,
                likes: newLikes,
                _count: { ...currentPost._count, likes: newLikeCount }
            }));

            try {
                await toggleMicroPostLike(post.id);
            } catch (error) {
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

                        <Accordion type="single" collapsible className="w-full mt-2">
                            <AccordionItem value="item-1" className="border-b-0">
                                <div className="flex justify-between items-center text-muted-foreground">
                                    <AccordionTrigger className="py-0 hover:no-underline">
                                        <div className="flex items-center gap-1.5 p-2 rounded-md hover:bg-accent">
                                            <MessageCircle className="h-4 w-4" />
                                            <span className="text-xs">{commentCount}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <div className="flex items-center gap-1.5">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLike} disabled={isLikePending}>
                                            <Heart className={cn("h-4 w-4", hasLiked && "fill-red-500 text-red-500")} />
                                        </Button>
                                        <span className="text-xs">{likeCount}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <AccordionContent>
                                    <MicroPostComments postId={post.id} onCommentCountChange={handleCommentCountChange} />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
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

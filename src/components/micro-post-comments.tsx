
// @ts-nocheck
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { getCommentsForMicroPost, createMicroPostComment, updateMicroPostComment, deleteMicroPostComment } from '@/lib/actions/comments';
import type { MicroPostComment as CommentType } from '@/lib/types';
import CommentCard from './comment-card';
import CommentForm from './comment-form';
import { Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface MicroPostCommentsProps {
    postId: string;
    onCommentCountChange: (count: number) => void;
}

export default function MicroPostComments({ postId, onCommentCountChange }: MicroPostCommentsProps) {
    const [comments, setComments] = useState<CommentType[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                setIsLoading(true);
                const fetchedComments = await getCommentsForMicroPost(postId);
                setComments(fetchedComments);
            } catch (error) {
                console.error("Failed to fetch comments", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchComments();
    }, [postId]);

    useEffect(() => {
        const countComments = (nodes: CommentType[]): number => {
            return nodes.length + nodes.reduce((sum, node) => sum + countComments(node.replies || []), 0);
        };
        onCommentCountChange(countComments(comments));
    }, [comments, onCommentCountChange]);

    const addCommentOrReply = (newComment: CommentType) => {
        if (newComment.parentId) {
            // It's a reply, add it to the correct parent
            const addReplyRecursively = (nodes: CommentType[]): CommentType[] => {
                return nodes.map(node => {
                    if (node.id === newComment.parentId) {
                        return { ...node, replies: [...(node.replies || []), newComment] };
                    }
                    if (node.replies && node.replies.length > 0) {
                        return { ...node, replies: addReplyRecursively(node.replies) };
                    }
                    return node;
                });
            };
            setComments(addReplyRecursively);
        } else {
            // It's a top-level comment
            setComments(prev => [newComment, ...prev]);
        }
    };

    const editCommentOrReply = (updatedComment: CommentType) => {
        const editRecursively = (nodes: CommentType[]): CommentType[] => {
            return nodes.map(node => {
                if (node.id === updatedComment.id) {
                    return { ...node, ...updatedComment };
                }
                if (node.replies && node.replies.length > 0) {
                    return { ...node, replies: editRecursively(node.replies) };
                }
                return node;
            });
        };
        setComments(editRecursively);
    };

    const removeCommentOrReply = (commentId: string) => {
        const removeRecursively = (nodes: CommentType[]): CommentType[] => {
            return nodes.filter(node => node.id !== commentId).map(node => {
                if (node.replies && node.replies.length > 0) {
                    return { ...node, replies: removeRecursively(node.replies) };
                }
                return node;
            });
        };
        setComments(removeRecursively);
    };

    return (
        <div className="mt-4 pt-4 border-t">
            <CommentForm
                postId={postId}
                onCommentCreated={addCommentOrReply}
            />
            <div className="mt-6 space-y-6">
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : comments.length > 0 ? (
                    comments.map(comment => (
                        <CommentCard
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            onReplyCreated={addCommentOrReply}
                            onCommentUpdated={editCommentOrReply}
                            onCommentDeleted={removeCommentOrReply}
                        />
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to reply!</p>
                )}
            </div>
        </div>
    );
}

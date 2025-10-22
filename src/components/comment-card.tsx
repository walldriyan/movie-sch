
'use client';

import React, { useState, useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ClientRelativeDate from '@/components/client-relative-date';
import { Button } from './ui/button';
import { MessageSquare, Trash2, MoreHorizontal, Loader2, Edit } from 'lucide-react';
import CommentForm from './comment-form';
import { useSession } from 'next-auth/react';
import { ROLES } from '@/lib/permissions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import type { MicroPostComment as CommentType } from '@/lib/types';
import { deleteMicroPostComment, updateMicroPostComment } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface CommentCardProps {
  comment: CommentType;
  postId: string;
  onReplyCreated: (newReply: CommentType) => void;
  onCommentUpdated: (updatedComment: CommentType) => void;
  onCommentDeleted: (commentId: string) => void;
}

export default function CommentCard({ comment, postId, onReplyCreated, onCommentUpdated, onCommentDeleted }: CommentCardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const currentUser = session?.user;

  if (!comment.user) return null;

  const canManage = currentUser && (currentUser.id === comment.userId || currentUser.role === ROLES.SUPER_ADMIN);

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deleteMicroPostComment(comment.id);
        onCommentDeleted(comment.id);
        toast({ title: "Comment deleted" });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  const handleUpdate = (updatedComment: CommentType) => {
      onCommentUpdated(updatedComment);
      setIsEditing(false);
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.user.image || ''} alt={comment.user.name || ''} />
              <AvatarFallback>{comment.user.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{comment.user.name}</p>
                <ClientRelativeDate date={comment.createdAt} />
              </div>
               {isEditing ? (
                  <CommentForm
                    postId={postId}
                    parentId={comment.parentId || undefined}
                    onCommentCreated={handleUpdate} // Re-using for update
                    existingComment={comment}
                    onCancel={() => setIsEditing(false)}
                  />
               ) : (
                  <p className="text-foreground/80 text-sm whitespace-pre-wrap">{comment.content}</p>
               )}
            </div>
        </div>
        {canManage && !isEditing && (
            <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                         <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                        </DropdownMenuItem>
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
                        This action cannot be undone. This will permanently delete this comment.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
      </div>
      <div className="text-foreground/80 pl-11">
        <div className="flex items-center gap-2 mt-2 ">
            <Button className='border border-border/60 ' variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Reply
            </Button>
        </div>
        {showReplyForm && (
            <div className="mt-4">
                <CommentForm 
                    postId={postId} 
                    parentId={comment.id}
                    onCommentCreated={(newReply) => {
                        onReplyCreated(newReply);
                        setShowReplyForm(false);
                    }}
                />
            </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-6 border-l-2 pl-4">
            {comment.replies.map(reply => (
              <CommentCard 
                key={reply.id} 
                comment={reply} 
                postId={postId}
                onReplyCreated={onReplyCreated}
                onCommentUpdated={onCommentUpdated}
                onCommentDeleted={onCommentDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

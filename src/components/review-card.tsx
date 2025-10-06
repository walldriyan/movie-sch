

'use client';

import React, { useState, useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RatingStars from '@/components/rating-stars';
import type { Review } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from './ui/button';
import { MessageSquare, Trash2, MoreHorizontal } from 'lucide-react';
import ReviewForm from './review-form';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ROLES } from '@/lib/permissions';
import { deleteReview } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReviewCardProps {
  review: Review;
  postId: number;
}

export default function ReviewCard({ review, postId }: ReviewCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const currentUser = useCurrentUser();
  const { toast } = useToast();
  
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-2');

  const canDelete = currentUser && (currentUser.id === review.userId || currentUser.role === ROLES.SUPER_ADMIN);

  const handleReplySuccess = () => {
    setShowReplyForm(false);
  }

  const handleDelete = () => {
    startDeleteTransition(async () => {
        try {
            await deleteReview(review.id);
            toast({
                title: "Review Deleted",
                description: "The review has been successfully removed.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to delete the review.",
            });
        }
    });
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={review.user.image || userAvatar?.imageUrl} alt={review.user.name || ''} data-ai-hint="person face" />
              <AvatarFallback>{review.user.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{review.user.name}</p>
              {review.rating > 0 && <RatingStars rating={review.rating} size={14} />}
            </div>
        </div>
        {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
      </div>
      <div className="text-foreground/80 pl-11">
        <p>{review.comment}</p>
        <div className="flex items-center gap-2 mt-1">
            <Button variant="outline" size="sm" onClick={() => setShowReplyForm(!showReplyForm)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Reply
            </Button>
        </div>
        {showReplyForm && (
            <div className="mt-4">
                <ReviewForm 
                    postId={postId} 
                    parentId={review.id} 
                    onSuccess={handleReplySuccess}
                    showAvatar={false}
                />
            </div>
        )}
        {review.replies && review.replies.length > 0 && (
          <div className="mt-4 space-y-6 border-l pl-6">
            {review.replies.map(reply => (
              <ReviewCard key={reply.id} review={reply} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

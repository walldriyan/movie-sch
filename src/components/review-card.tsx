
'use client';

import React, { useState, useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RatingStars from '@/components/rating-stars';
import type { Review } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from './ui/button';
import { MessageSquare, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import ReviewForm from './review-form';
import { ROLES } from '@/lib/permissions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Session } from 'next-auth';

interface ReviewCardProps {
  review: Review;
  onReviewSubmit: (comment: string, rating: number, parentId?: number) => Promise<void>;
  onReviewDelete: (reviewId: number) => Promise<void>;
  session: Session | null;
}

export default function ReviewCard({ review, onReviewSubmit, onReviewDelete, session }: ReviewCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSubmittingReply, startReplyTransition] = useTransition();

  const [isExpanded, setIsExpanded] = useState(false);

  const currentUser = session?.user;
  
  if (!review.user) {
    return null;
  }
  
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-2');

  const canDelete = currentUser && (currentUser.id === review.userId || currentUser.role === ROLES.SUPER_ADMIN);

  const handleReplySuccess = () => {
    setShowReplyForm(false);
  }

  const handleDelete = () => {
    startDeleteTransition(async () => {
        await onReviewDelete(review.id);
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
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
      </div>
      <div className="text-foreground/80 pl-11">
        <div className="w-[78%] bg-muted/20 border border-border/20 rounded-2xl p-3 transition-all duration-300 ease-in-out">
            <p className={cn("transition-all duration-300", isExpanded ? "line-clamp-none" : "line-clamp-2")}>
                {review.comment}
            </p>
            {review.comment.length > 150 && (
                 <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className="text-primary hover:text-primary/80 text-xs font-semibold focus:outline-none mt-2 rounded-full border border-border/5 px-2 py-0.5"
                >
                    {isExpanded ? 'See Less' : 'See More'}
                </button>
            )}
        </div>
        <div className="flex items-center gap-2 mt-3 ">
            <Button className='border border-border/60 ' variant="outline" size="sm" onClick={() => setShowReplyForm(!showReplyForm)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Reply
            </Button>
        </div>
        {showReplyForm && (
            <div className="mt-4">
                <ReviewForm 
                    postId={review.postId} 
                    parentId={review.id} 
                    onSuccess={handleReplySuccess}
                    showAvatar={false}
                    isSubmitting={isSubmittingReply}
                    onSubmitReview={onReviewSubmit}
                    session={session}
                />
            </div>
        )}
        {review.replies && review.replies.length > 0 && (
          <div className="mt-4 space-y-6 border-l pl-6">
            {review.replies.map(reply => (
              <ReviewCard key={reply.id} review={reply} onReviewSubmit={onReviewSubmit} onReviewDelete={onReviewDelete} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

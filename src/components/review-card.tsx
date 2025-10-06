
'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RatingStars from '@/components/rating-stars';
import type { Review } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from './ui/button';
import { MessageSquare } from 'lucide-react';
import ReviewForm from './review-form';

interface ReviewCardProps {
  review: Review;
  postId: number;
}

export default function ReviewCard({ review, postId }: ReviewCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-2');

  const handleReplySuccess = () => {
    setShowReplyForm(false);
  }

  return (
    <div className="flex flex-col">
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
      <div className="text-foreground/80 pl-11">
        <p>{review.comment}</p>
        <Button variant="ghost" size="sm" className="mt-1" onClick={() => setShowReplyForm(!showReplyForm)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Reply
        </Button>
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

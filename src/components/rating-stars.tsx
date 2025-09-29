'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface RatingStarsProps {
  rating: number;
  totalStars?: number;
  size?: number;
  fillColor?: string;
  emptyColor?: string;
  className?: string;
  onRatingChange?: (rating: number) => void;
  isEditable?: boolean;
}

export default function RatingStars({
  rating,
  totalStars = 5,
  size = 20,
  fillColor = 'text-yellow-400',
  emptyColor = 'text-muted-foreground',
  className,
  onRatingChange,
  isEditable = false,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (index: number) => {
    if (isEditable) {
      setHoverRating(index + 1);
    }
  };

  const handleMouseLeave = () => {
    if (isEditable) {
      setHoverRating(0);
    }
  };

  const handleClick = (index: number) => {
    if (isEditable && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const displayRating = hoverRating > 0 ? hoverRating : rating;

  return (
    <div className={cn('flex items-center', className)}>
      {[...Array(totalStars)].map((_, index) => (
        <Star
          key={index}
          size={size}
          className={cn(
            'transition-colors',
            isEditable ? 'cursor-pointer' : '',
            index < displayRating ? fillColor : emptyColor
          )}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(index)}
          fill={index < displayRating ? 'currentColor' : 'transparent'}
        />
      ))}
    </div>
  );
}

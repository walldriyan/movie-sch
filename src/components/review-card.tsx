import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RatingStars from '@/components/rating-stars';
import type { Review } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const userAvatar = PlaceHolderImages.find((img) => img.id === review.user.avatarUrlId);
  
  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-3 mb-2">
        <Avatar className='h-8 w-8'>
          {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={review.user.name} data-ai-hint={userAvatar.imageHint} />}
          <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
            <p className="font-semibold text-sm">{review.user.name}</p>
            <RatingStars rating={review.rating} size={14} />
        </div>
      </div>
      <div className="text-foreground/80">
        <p>{review.comment}</p>
      </div>
    </div>
  );
}

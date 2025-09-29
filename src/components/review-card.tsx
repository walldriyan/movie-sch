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
    <div className="flex space-x-4">
      <Avatar>
        {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt={review.user.name} data-ai-hint={userAvatar.imageHint} />}
        <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{review.user.name}</p>
          <RatingStars rating={review.rating} size={16} />
        </div>
        <p className="mt-2 text-muted-foreground">{review.comment}</p>
      </div>
    </div>
  );
}

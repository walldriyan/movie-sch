
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import RatingStars from './rating-stars';
import { Send } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { createReview } from '@/lib/actions';
import { useTransition } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const reviewFormSchema = z.object({
  rating: z.number().min(0).max(5),
  comment: z
    .string()
    .min(3, {
      message: 'Review must be at least 3 characters.',
    })
    .max(1000, {
      message: 'Review must not be longer than 1000 characters.',
    }),
});

interface ReviewFormProps {
  postId: number;
  parentId?: number;
  onSuccess?: () => void;
  showAvatar?: boolean;
}

export default function ReviewForm({ postId, parentId, onSuccess, showAvatar = true }: ReviewFormProps) {
  const { toast } = useToast();
  const user = useCurrentUser();
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-4');
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  function onSubmit(values: z.infer<typeof reviewFormSchema>) {
    startTransition(async () => {
      try {
        if (!user) {
          toast({ variant: 'destructive', title: 'You must be logged in.' });
          return;
        }
        await createReview(postId, values.comment, values.rating, parentId);
        toast({
          title: 'Response Submitted!',
          description: "Thanks for sharing your thoughts.",
        });
        form.reset();
        if (onSuccess) {
          onSuccess();
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || "Could not submit your review.",
        });
      }
    });
  }

  return (
    <div className='flex items-start gap-4'>
      {showAvatar && (
        <Avatar className='mt-2'>
          <AvatarImage src={user?.image || userAvatar?.imageUrl} alt={user?.name || 'User'} data-ai-hint="person face" />
          <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
      )}
      <div className="w-full">
        { !parentId && <h3 className="text-lg font-semibold mb-4">What are your thoughts?</h3>}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!parentId && (
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RatingStars
                        rating={field.value}
                        onRatingChange={field.onChange}
                        isEditable={true}
                        size={24}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder={parentId ? "Write a reply..." : "Tell us what you think about the movie..."}
                      className="resize-none bg-transparent border-0 border-b rounded-none focus-visible:ring-0 p-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end'>
              <Button type="submit" variant='ghost' disabled={isPending}>
                {isPending ? 'Replying...' : 'Respond'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

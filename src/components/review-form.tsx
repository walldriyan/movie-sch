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

const reviewFormSchema = z.object({
  rating: z.number().min(1, { message: 'Please select a rating.' }).max(5),
  comment: z
    .string()
    .min(10, {
      message: 'Review must be at least 10 characters.',
    })
    .max(500, {
      message: 'Review must not be longer than 500 characters.',
    }),
});

export default function ReviewForm() {
  const { toast } = useToast();
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-4');

  const form = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  function onSubmit(values: z.infer<typeof reviewFormSchema>) {
    console.log(values);
    toast({
      title: 'Response Submitted!',
      description: "Thanks for sharing your thoughts.",
    });
    form.reset();
  }

  return (
    <div className='flex items-start gap-4'>
       <Avatar className='mt-2'>
        {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User" data-ai-hint={userAvatar.imageHint} />}
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-4">What are your thoughts?</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us what you think about the movie..."
                      className="resize-none bg-transparent border-0 border-b rounded-none focus-visible:ring-0 p-0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex justify-end'>
              <Button type="submit" variant='ghost'>
                Respond
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

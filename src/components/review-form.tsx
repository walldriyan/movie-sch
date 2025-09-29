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
      title: 'Review Submitted!',
      description: "Thanks for sharing your thoughts.",
    });
    form.reset();
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Write a review</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Rating</FormLabel>
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
                <FormLabel>Your Review</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us what you think about the movie..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">
            <Send className="mr-2 h-4 w-4"/>
            Submit Review
          </Button>
        </form>
      </Form>
    </div>
  );
}

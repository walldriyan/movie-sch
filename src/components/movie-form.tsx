
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Movie } from '@/lib/types';
import { useEffect } from 'react';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  year: z.coerce.number().min(1800, 'Invalid year'),
  duration: z.string().min(1, 'Duration is required'),
  genres: z.string().min(1, 'Genres are required'),
  description: z.string().min(10, 'Description is required'),
  posterUrlId: z.string().min(1, 'Poster URL ID is required'),
  imdbRating: z.coerce.number().min(0).max(10),
});

type MovieFormValues = z.infer<typeof movieSchema>;

interface MovieFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSubmit: (movieData: any) => void;
  movie: Movie | null;
}

export default function MovieForm({
  isOpen,
  setIsOpen,
  onSubmit,
  movie,
}: MovieFormProps) {
  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: '',
      year: new Date().getFullYear(),
      duration: '',
      genres: '',
      description: '',
      posterUrlId: 'movie-poster-inception', // Default placeholder
      imdbRating: 0,
    },
  });

  useEffect(() => {
    if (movie) {
      form.reset({
        title: movie.title,
        year: movie.year,
        duration: movie.duration,
        genres: movie.genres.join(', '),
        description: Array.isArray(movie.description) ? movie.description.join('\n\n') : movie.description,
        posterUrlId: movie.posterUrlId,
        imdbRating: movie.imdbRating,
      });
    } else {
      form.reset({
        title: '',
        year: new Date().getFullYear(),
        duration: '',
        genres: '',
        description: '',
        posterUrlId: 'movie-poster-inception',
        imdbRating: 0,
      });
    }
  }, [movie, form, isOpen]);

  const handleFormSubmit = (values: MovieFormValues) => {
    const processedMovie = {
      ...(movie || {}),
      id: movie?.id || Date.now(),
      title: values.title,
      year: values.year,
      duration: values.duration,
      genres: values.genres.split(',').map((g) => g.trim()),
      description: values.description.split('\n\n'),
      posterUrlId: values.posterUrlId,
      imdbRating: values.imdbRating,
      // Keep existing data that's not in the form
      galleryImageIds: movie?.galleryImageIds || [],
      viewCount: movie?.viewCount || 0,
      likes: movie?.likes || 0,
      reviews: movie?.reviews || [],
      subtitles: movie?.subtitles || [],
    };
    onSubmit(processedMovie);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{movie ? 'Edit Movie' : 'Add New Movie'}</DialogTitle>
          <DialogDescription>
            {movie
              ? 'Make changes to the movie details below.'
              : 'Fill in the details to add a new movie to the catalog.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Inception" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2010" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="2h 28m" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="genres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genres</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Sci-Fi, Action, Thriller (comma-separated)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="imdbRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMDb Rating</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A mind-bending thriller..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="posterUrlId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poster URL ID</FormLabel>
                  <FormControl>
                    <Input placeholder="movie-poster-inception" {...field} />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end pt-4">
              <Button type="submit">
                {movie ? 'Save Changes' : 'Add Movie'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

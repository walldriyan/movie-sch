'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import QuillEditor from '@/components/quill-editor';
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import type { Movie } from '@prisma/client';
import type { MovieFormData } from '@/lib/types';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  posterUrl: z.string().optional(),
  galleryImageIds: z.array(z.string()).optional().default([]),
  description: z.string().min(10, 'Description is required'),
  year: z.coerce.number().min(1800, 'Invalid year'),
  duration: z.string().min(1, 'Duration is required'),
  genres: z.string().min(1, 'Genres are required'),
  imdbRating: z.coerce.number().min(0).max(10),
});

type MovieFormValues = z.infer<typeof movieSchema>;

interface MovieFormProps {
  editingMovie: Movie | null;
  onFormSubmit: (movieData: MovieFormData, id?: number) => Promise<void>;
  onBack: () => void;
}

export default function MovieForm({
  editingMovie,
  onFormSubmit,
  onBack,
}: MovieFormProps) {
  const posterFileInputRef = React.useRef<HTMLInputElement>(null);
  const galleryFileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: editingMovie
      ? {
          title: editingMovie.title,
          posterUrl: editingMovie.posterUrl || '',
          galleryImageIds: (editingMovie.galleryImageIds as any) || [],
          description: editingMovie.description,
          year: editingMovie.year,
          duration: editingMovie.duration,
          genres: (editingMovie.genres as any).join(', '),
          imdbRating: editingMovie.imdbRating,
        }
      : {
          title: '',
          posterUrl: '',
          galleryImageIds: [],
          description: '',
          year: new Date().getFullYear(),
          duration: '',
          genres: '',
          imdbRating: 0,
        },
  });

  const posterUrlValue = form.watch('posterUrl');
  const galleryImageIdsValue = form.watch('galleryImageIds');

  const handleSubmit = async (values: MovieFormValues) => {
    const movieData: MovieFormData = {
      title: values.title,
      description: values.description,
      posterUrl: values.posterUrl || null,
      galleryImageIds: values.galleryImageIds || [],
      year: values.year,
      duration: values.duration,
      genres: values.genres.split(',').map((g) => g.trim()) as any,
      imdbRating: values.imdbRating,
      status: 'PUBLISHED',
      viewCount: editingMovie?.viewCount || 0,
      likes: editingMovie?.likes || 0,
    };
    await onFormSubmit(movieData, editingMovie?.id);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    isGallery: boolean
  ) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) {
          if (isGallery) {
            form.setValue(
              'galleryImageIds',
              [...(form.getValues('galleryImageIds') || []), src],
              { shouldValidate: true, shouldDirty: true }
            );
          } else {
            form.setValue('posterUrl', src, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    const newImages = (form.getValues('galleryImageIds') || []).filter(
      (_, i) => i !== index
    );
    form.setValue('galleryImageIds', newImages, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {editingMovie ? 'Edit Movie' : 'Add New Movie'}
          </h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Title"
                    {...field}
                    className="border-0 border-b-2 border-gray-700 rounded-none text-4xl font-bold p-0 bg-transparent focus-visible:ring-0 focus:border-primary shadow-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="posterUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-muted-foreground">
                  Poster Image
                </FormLabel>
                <div className="flex items-center gap-8">
                  <div className="w-32 h-44 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {posterUrlValue ? (
                      <Image
                        src={posterUrlValue}
                        alt="Poster Preview"
                        width={128}
                        height={176}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-grow space-y-2">
                    <FormControl>
                      <Input
                        placeholder="Paste image URL"
                        {...field}
                        value={field.value || ''}
                        className="bg-transparent border-input"
                      />
                    </FormControl>
                    <FormDescription>Or</FormDescription>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => posterFileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload an image
                    </Button>
                    <input
                      type="file"
                      ref={posterFileInputRef}
                      onChange={(e) => handleFileChange(e, false)}
                      style={{ display: 'none' }}
                      accept="image/*"
                    />
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="galleryImageIds"
            render={() => (
              <FormItem>
                <FormLabel className="text-muted-foreground">
                  Gallery Images
                </FormLabel>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {galleryImageIdsValue?.map((src, index) => (
                    <div key={index} className="relative group aspect-square">
                      <Image
                        src={src}
                        alt={`Gallery image ${index + 1}`}
                        fill
                        className="object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeGalleryImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="aspect-square w-full h-full flex-col"
                    onClick={() => galleryFileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6" />
                    <span>Upload</span>
                  </Button>
                </div>
                <input
                  type="file"
                  ref={galleryFileInputRef}
                  onChange={(e) => handleFileChange(e, true)}
                  style={{ display: 'none' }}
                  accept="image/*"
                  multiple
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <QuillEditor {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4 pt-8 border-t border-dashed border-gray-700">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Movie Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2024"
                        {...field}
                        className="bg-transparent border-input"
                      />
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
                    <FormLabel className="text-muted-foreground">
                      Duration
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="2h 28m"
                        {...field}
                        className="bg-transparent border-input"
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
                    <FormLabel className="text-muted-foreground">
                      IMDb Rating
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        className="bg-transparent border-input"
                      />
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
                  <FormLabel className="text-muted-foreground">
                    Genres (comma-separated)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Sci-Fi, Action, Thriller"
                      {...field}
                      className="bg-transparent border-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg">
              {editingMovie ? 'Save Changes' : 'Publish'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

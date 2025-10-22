

'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuillEditor from '@/components/quill-editor';
import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import type { Movie } from '@prisma/client';
import type { MovieFormData, MediaLink } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { GenreInput } from './genre-input';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  posterUrl: z.string().optional(),
  description: z.string().min(10, 'Description is required'),
  year: z.coerce.number().min(1800, 'Invalid year'),
  duration: z.string().min(1, 'Duration is required'),
  genres: z.array(z.string()).min(1, 'At least one genre is required'),
  directors: z.string().optional(),
  mainCast: z.string().optional(),
  imdbRating: z.coerce.number().min(0).max(10),
  rottenTomatoesRating: z.coerce.number().min(0).max(100).optional(),
  googleRating: z.coerce.number().min(0).max(100).optional(),
  mediaLinks: z.array(z.object({
    type: z.enum(['trailer', 'image']),
    url: z.string().url('Please enter a valid URL.').min(1, 'URL is required.'),
  })).optional(),
});

type MovieFormValues = z.infer<typeof movieSchema>;

type MovieWithLinks = Movie & { mediaLinks: MediaLink[], genres: string[] };
interface MovieFormProps {
  editingMovie: MovieWithLinks | null;
  onFormSubmit: (movieData: MovieFormData, id?: number) => Promise<void>;
  onBack: () => void;
  error?: string | null;
}

export default function MovieForm({
  editingMovie,
  onFormSubmit,
  onBack,
  error,
}: MovieFormProps) {
  const posterFileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: editingMovie
      ? {
          title: editingMovie.title,
          posterUrl: editingMovie.posterUrl || '',
          description: editingMovie.description,
          year: editingMovie.year,
          duration: editingMovie.duration,
          genres: editingMovie.genres || [],
          directors: editingMovie.directors || '',
          mainCast: editingMovie.mainCast || '',
          imdbRating: editingMovie.imdbRating,
          rottenTomatoesRating: editingMovie.rottenTomatoesRating || undefined,
          googleRating: editingMovie.googleRating || undefined,
          mediaLinks: editingMovie.mediaLinks || [],
        }
      : {
          title: '',
          posterUrl: '',
          description: '',
          year: new Date().getFullYear(),
          duration: '',
          genres: [],
          directors: '',
          mainCast: '',
          imdbRating: 0,
          rottenTomatoesRating: undefined,
          googleRating: undefined,
          mediaLinks: [],
        },
  });
  
  const { control, formState } = form;
  const posterUrlValue = form.watch('posterUrl');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'mediaLinks',
  });

  const handleSubmit = async (values: MovieFormValues) => {
    const movieData: MovieFormData = {
      title: values.title,
      description: values.description,
      posterUrl: values.posterUrl || null,
      year: values.year,
      duration: values.duration,
      genres: values.genres,
      directors: values.directors || null,
      mainCast: values.mainCast || null,
      imdbRating: values.imdbRating,
      rottenTomatoesRating: values.rottenTomatoesRating || null,
      googleRating: values.googleRating || null,
      status: editingMovie?.status || 'DRAFT',
      viewCount: editingMovie?.viewCount || 0,
      mediaLinks: values.mediaLinks,
    };
    await onFormSubmit(movieData, editingMovie?.id);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) {
        form.setValue('posterUrl', src, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    };
    reader.readAsDataURL(file);
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
                      onChange={(e) => handleFileChange(e)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
             <FormField
                control={form.control}
                name="directors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">
                      Director(s) (comma-separated)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Christopher Nolan"
                        {...field}
                         value={field.value || ''}
                        className="bg-transparent border-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="mainCast"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">
                      Main Cast (comma-separated)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cillian Murphy, Emily Blunt"
                        {...field}
                         value={field.value || ''}
                        className="bg-transparent border-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="genres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">
                    Genres
                  </FormLabel>
                  <FormControl>
                    <GenreInput 
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select one or more genres"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <h3 className="text-lg font-semibold text-muted-foreground pt-4">
              Ratings
            </h3>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
               <FormField
                control={form.control}
                name="rottenTomatoesRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">
                      Rotten Tomatoes (%)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="93"
                        {...field}
                        value={field.value ?? ''}
                        className="bg-transparent border-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                 <FormField
                control={form.control}
                name="googleRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">
                      Google Users (%)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="91"
                        {...field}
                        value={field.value ?? ''}
                        className="bg-transparent border-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-dashed border-gray-700">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Media Links
            </h3>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-4 border rounded-lg">
                  <FormField
                    control={control}
                    name={`mediaLinks.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="w-1/3">
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="trailer">Trailer</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={control}
                    name={`mediaLinks.${index}.url`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ type: 'trailer', url: '' })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Link
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingMovie ? 'Saving...' : 'Publishing...'}
                </>
              ) : editingMovie ? (
                'Save Changes'
              ) : (
                'Publish'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

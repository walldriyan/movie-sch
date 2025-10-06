

'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

import QuillEditor from '@/components/quill-editor';
import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2, AlertCircle, Plus, Trash2, ChevronsUpDown, Check, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import type { Post, Series } from '@prisma/client';
import { PostType } from '@prisma/client';
import type { PostFormData, MediaLink } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { GenreInput } from './genre-input';
import { getSeries, createSeries } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  posterUrl: z.string().optional(),
  description: z.string().min(10, 'Description is required'),
  year: z.coerce.number().min(1800, 'Invalid year').optional(),
  duration: z.string().optional(),
  genres: z.array(z.string()).optional(),
  directors: z.string().optional(),
  mainCast: z.string().optional(),
  imdbRating: z.coerce.number().min(0).max(10).optional(),
  rottenTomatoesRating: z.coerce.number().min(0).max(100).optional(),
  googleRating: z.coerce.number().min(0).max(100).optional(),
  mediaLinks: z.array(z.object({
    type: z.enum(['trailer', 'image']),
    url: z.string().url('Please enter a valid URL.').min(1, 'URL is required.'),
  })).optional(),
  type: z.nativeEnum(PostType),
  seriesId: z.coerce.number().optional(),
  orderInSeries: z.coerce.number().optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

type PostWithLinks = Post & { mediaLinks: MediaLink[], genres: string[] };
interface PostFormProps {
  editingPost: PostWithLinks | null;
  onFormSubmit: (postData: PostFormData, id?: number) => Promise<void>;
  onBack: () => void;
  error?: string | null;
}

function SeriesCombobox({ field, seriesList, onSeriesCreated }: { field: any, seriesList: Series[], onSeriesCreated: (newSeries: Series) => void }) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleCreateSeries = (seriesTitle: string) => {
    startTransition(async () => {
      try {
        const newSeries = await createSeries(seriesTitle);
        toast({ title: "Series created", description: `"${newSeries.title}" has been created.` });
        onSeriesCreated(newSeries);
        field.onChange(newSeries.id);
        setOpen(false);
      } catch (e: any) {
        toast({ variant: "destructive", title: "Error creating series", description: e.message });
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value
              ? seriesList.find(
                  (s) => s.id === field.value
                )?.title
              : "Select a series (optional)"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search series or create new..." />
          <CommandList>
            <CommandEmpty>
               <Button
                  onClick={() => {
                    const input = document.querySelector('[cmdk-input]') as HTMLInputElement;
                    if (input.value) {
                       handleCreateSeries(input.value);
                    }
                  }}
                  disabled={isPending}
                  variant="outline"
                  className="w-full"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create a new series
                </Button>
            </CommandEmpty>
            <CommandGroup>
              {seriesList.map((s) => (
                <CommandItem
                  value={s.title}
                  key={s.id}
                  onSelect={() => {
                    field.onChange(s.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      s.id === field.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {s.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


export default function PostForm({
  editingPost,
  onFormSubmit,
  onBack,
  error,
}: PostFormProps) {
  const posterFileInputRef = React.useRef<HTMLInputElement>(null);
  const [seriesList, setSeriesList] = useState<Series[]>([]);

  useEffect(() => {
    async function fetchSeries() {
      const seriesData = await getSeries();
      setSeriesList(seriesData);
    }
    fetchSeries();
  }, []);
  
  const handleSeriesCreated = (newSeries: Series) => {
    setSeriesList((prev) => [...prev, newSeries]);
  }

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: editingPost
      ? {
          title: editingPost.title,
          posterUrl: editingPost.posterUrl || '',
          description: editingPost.description,
          year: editingPost.year || undefined,
          duration: editingPost.duration || '',
          genres: editingPost.genres || [],
          directors: editingPost.directors || '',
          mainCast: editingPost.mainCast || '',
          imdbRating: editingPost.imdbRating || undefined,
          rottenTomatoesRating: editingPost.rottenTomatoesRating || undefined,
          googleRating: editingPost.googleRating || undefined,
          mediaLinks: editingPost.mediaLinks || [],
          type: editingPost.type,
          seriesId: editingPost.seriesId || undefined,
          orderInSeries: editingPost.orderInSeries || undefined,
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
          type: PostType.MOVIE,
          seriesId: undefined,
          orderInSeries: undefined,
        },
  });
  
  const { control, formState, watch } = form;
  const posterUrlValue = watch('posterUrl');
  const postType = watch('type');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'mediaLinks',
  });

  const handleSubmit = async (values: PostFormValues) => {
    const postData: PostFormData = {
      title: values.title,
      description: values.description,
      posterUrl: values.posterUrl || null,
      year: values.year || null,
      duration: values.duration || null,
      genres: values.genres || [],
      directors: values.directors || null,
      mainCast: values.mainCast || null,
      imdbRating: values.imdbRating || null,
      rottenTomatoesRating: values.rottenTomatoesRating || null,
      googleRating: values.googleRating || null,
      status: editingPost?.status || 'DRAFT',
      viewCount: editingPost?.viewCount || 0,
      mediaLinks: values.mediaLinks,
      type: values.type,
      seriesId: values.seriesId,
      orderInSeries: values.orderInSeries,
    };
    await onFormSubmit(postData, editingPost?.id);
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
            {editingPost ? 'Edit Post' : 'Add New Post'}
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
              Post Details
            </h3>

             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PostType).map((type) => (
                           <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="seriesId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Series</FormLabel>
                       <SeriesCombobox field={field} seriesList={seriesList} onSeriesCreated={handleSeriesCreated}/>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="orderInSeries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order in Series</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 1"
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
            
            {(postType === PostType.MOVIE || postType === PostType.TV_SERIES) && (
              <>
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
                            value={field.value ?? ''}
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
                          value={field.value || []}
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
              </>
            )}
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
                  {editingPost ? 'Saving...' : 'Publishing...'}
                </>
              ) : editingPost ? (
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

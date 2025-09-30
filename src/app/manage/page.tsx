'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Header from '@/components/header';
import { MoreHorizontal, PlusCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import type { Movie } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

const LOCAL_STORAGE_KEY = 'movies_data';

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

export default function ManageMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  
  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
  });

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedMovies = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedMovies) {
        setMovies(JSON.parse(storedMovies));
      } else {
        const initialMovies: Movie[] = [];
        setMovies(initialMovies);
      }
    } catch (error) {
      console.error("Could not parse movies from localStorage", error);
      setMovies([]);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(movies));
    }
  }, [movies, isMounted]);

  const handleAddNewMovie = () => {
    setEditingMovie(null);
    form.reset({
      title: '',
      year: new Date().getFullYear(),
      duration: '',
      genres: '',
      description: '',
      posterUrlId: '',
      imdbRating: 0,
    });
    setView('form');
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    form.reset({
      title: movie.title,
      year: movie.year,
      duration: movie.duration,
      genres: movie.genres.join(', '),
      description: Array.isArray(movie.description) ? movie.description.join('\n\n') : movie.description,
      posterUrlId: movie.posterUrlId,
      imdbRating: movie.imdbRating,
    });
    setView('form');
  };

  const handleDeleteMovie = (movie: Movie) => {
    setMovieToDelete(movie);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (movieToDelete) {
      setMovies(movies.filter((m) => m.id !== movieToDelete.id));
      setMovieToDelete(null);
    }
    setDeleteAlertOpen(false);
  };

  const handleFormSubmit = (values: MovieFormValues) => {
    const processedMovie: Movie = {
      id: editingMovie?.id || Date.now(),
      title: values.title,
      year: values.year,
      duration: values.duration,
      genres: values.genres.split(',').map((g) => g.trim()),
      description: values.description.split('\n\n'),
      posterUrlId: values.posterUrlId,
      imdbRating: values.imdbRating,
      galleryImageIds: editingMovie?.galleryImageIds || [],
      viewCount: editingMovie?.viewCount || 0,
      likes: editingMovie?.likes || 0,
      reviews: editingMovie?.reviews || [],
      subtitles: editingMovie?.subtitles || [],
    };
    
    if (editingMovie) {
      setMovies(
        movies.map((m) => (m.id === processedMovie.id ? processedMovie : m))
      );
    } else {
      setMovies([processedMovie, ...movies]);
    }
    setView('list');
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Please wait while we load the movie management console.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {view === 'list' ? (
            <>
              <div className="flex items-center">
                <h1 className="font-semibold text-lg md:text-2xl">Manage Movies</h1>
                <Button className="ml-auto" size="sm" onClick={handleAddNewMovie}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Movie
                </Button>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Movies</CardTitle>
                  <CardDescription>
                    A list of all movies in the catalog.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden w-[100px] sm:table-cell">
                          <span className="sr-only">Image</span>
                        </TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Genres</TableHead>
                        <TableHead className="hidden md:table-cell">Year</TableHead>
                        <TableHead>
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movies.length > 0 ? (
                        movies.map((movie) => {
                          const poster = PlaceHolderImages.find(
                            (p) => p.id === movie.posterUrlId
                          );
                          return (
                            <TableRow key={movie.id}>
                              <TableCell className="hidden sm:table-cell">
                                {poster ? (
                                  <Image
                                    alt={movie.title}
                                    className="aspect-square rounded-md object-cover"
                                    height="64"
                                    src={poster.imageUrl}
                                    width="64"
                                    data-ai-hint={poster.imageHint}
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                    <PlusCircle/>
                                  </div>
                                ) }
                              </TableCell>
                              <TableCell className="font-medium">
                                {movie.title}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {movie.genres.map((genre) => (
                                    <Badge key={genre} variant="outline">
                                      {genre}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {movie.year}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      aria-haspopup="true"
                                      size="icon"
                                      variant="ghost"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Toggle menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => handleEditMovie(movie)}>
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteMovie(movie)}
                                      className="text-destructive"
                                    >
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No movies found. Add one to get started.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="max-w-3xl mx-auto">
               <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => setView('list')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h1>
                </div>
              </div>
              
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleFormSubmit)}
                  className="space-y-8"
                >
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Tell your story..."
                            className="border-0 p-0 bg-transparent focus-visible:ring-0 text-lg min-h-[200px] shadow-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4 pt-8 border-t border-dashed border-gray-700">
                    <h3 className="text-lg font-semibold text-muted-foreground">Movie Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground">Year</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="2024" {...field} className="bg-transparent border-input" />
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
                            <FormLabel className="text-muted-foreground">Duration</FormLabel>
                            <FormControl>
                              <Input placeholder="2h 28m" {...field} className="bg-transparent border-input" />
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
                            <FormLabel className="text-muted-foreground">IMDb Rating</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" {...field} className="bg-transparent border-input"/>
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
                          <FormLabel className="text-muted-foreground">Genres (comma-separated)</FormLabel>
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
                     <FormField
                      control={form.control}
                      name="posterUrlId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">Poster URL ID</FormLabel>
                          <FormControl>
                            <Input placeholder="An ID from placeholder-images.json" {...field} className="bg-transparent border-input" />
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
          )}
        </main>
      </div>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              movie &quot;{movieToDelete?.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

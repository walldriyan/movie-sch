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
import {
  MoreHorizontal,
  PlusCircle,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  LayoutGrid,
  Bookmark,
  User,
  Settings,
  Home,
  Film,
  Trash,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import React, { useEffect, useState } from 'react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import QuillEditor from '@/components/quill-editor';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PERMISSIONS } from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import AuthGuard from '@/components/auth/auth-guard';


const LOCAL_STORAGE_KEY = 'movies_data';

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

export default function ManageMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const posterFileInputRef = React.useRef<HTMLInputElement>(null);
  const galleryFileInputRef = React.useRef<HTMLInputElement>(null);
  const user = useCurrentUser();
  const { toast } = useToast();

  const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-4');


  const form = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
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

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedMovies = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedMovies) {
        setMovies(JSON.parse(storedMovies));
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
        setMovies([]);
      }
    } catch (error) {
      console.error('Could not parse movies from localStorage', error);
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
      posterUrl: '',
      galleryImageIds: [],
      description: '',
      year: new Date().getFullYear(),
      duration: '',
      genres: '',
      imdbRating: 0,
    });
    setView('form');
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    form.reset({
      title: movie.title,
      posterUrl: movie.posterUrl || '',
      galleryImageIds: movie.galleryImageIds || [],
      description: movie.description,
      year: movie.year,
      duration: movie.duration,
      genres: movie.genres.join(', '),
      imdbRating: movie.imdbRating,
    });
    setView('form');
  };

  const handleDeleteMovie = (movie: Movie) => {
    setMovieToDelete(movie);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (movieToDelete && user?.permissions) {
      if (user.permissions.includes(PERMISSIONS['post.hard_delete'])) {
         // Super admin: permanent delete
        setMovies(movies.filter((m) => m.id !== movieToDelete.id));
        toast({ title: 'Movie Deleted', description: `"${movieToDelete.title}" has been permanently deleted.` });
      } else if (user.permissions.includes(PERMISSIONS['post.delete'])) {
        // User admin: soft delete (set status)
        const updatedMovies = movies.map((m) =>
          m.id === movieToDelete.id ? { ...m, status: 'PENDING_DELETION' } : m
        );
        setMovies(updatedMovies);
        toast({ title: 'Deletion Requested', description: `"${movieToDelete.title}" is pending approval for deletion.` });
      } else {
        toast({ variant: 'destructive', title: 'Unauthorized', description: 'You do not have permission to delete movies.' });
      }
      setMovieToDelete(null);
    }
    setDeleteAlertOpen(false);
  };

  const handleFormSubmit = (values: MovieFormValues) => {
    if (editingMovie) {
      // This is an edit
      const updatedMovie: Movie = {
        ...editingMovie,
        ...values,
        posterUrl: values.posterUrl || '',
        galleryImageIds: values.galleryImageIds || [],
        genres: values.genres.split(',').map((g) => g.trim()),
      };
      setMovies(
        movies.map((m) => (m.id === updatedMovie.id ? updatedMovie : m))
      );
    } else {
      // This is a new movie
      const newMovie: Movie = {
        id: Date.now(),
        ...values,
        posterUrl: values.posterUrl || '',
        galleryImageIds: values.galleryImageIds || [],
        genres: values.genres.split(',').map((g) => g.trim()),
        viewCount: 0,
        likes: 0,
        reviews: [],
        subtitles: [],
        status: 'PUBLISHED' // Add status field
      };
      setMovies([newMovie, ...movies]);
    }
    setView('list');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, isGallery: boolean) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src) {
                if (isGallery) {
                    form.setValue('galleryImageIds', [...(form.getValues('galleryImageIds') || []), src], {
                        shouldValidate: true,
                        shouldDirty: true,
                    });
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
    const currentImages = form.getValues('galleryImageIds') || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    form.setValue('galleryImageIds', newImages, {
        shouldValidate: true,
        shouldDirty: true,
    });
  }

  const visibleMovies = user?.permissions?.includes(PERMISSIONS['post.approve_deletion'])
    ? movies
    : movies.filter(m => m.status !== 'PENDING_DELETION');


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
      <SidebarProvider>
        <Sidebar variant="inset" collapsible="icon">
          <SidebarContent className="p-0 flex flex-col">
            <div className='p-4'>
              <Link href="/" className="flex items-center space-x-2">
                <Film className="h-7 w-7 text-primary" />
                <span className="inline-block font-bold font-serif text-2xl group-data-[collapsible=icon]:hidden">
                  CineVerse
                </span>
              </Link>
            </div>

            <SidebarMenu className="p-4 gap-1.5">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-base">
                  <Link href="/">
                    <Home />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <AuthGuard requiredRole='USER_ADMIN'>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive className="text-base">
                    <LayoutGrid />
                    <span>My Movies</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </AuthGuard>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-base">
                  <Bookmark />
                  <span>Favorites</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-base">
                  <User />
                  <span>Profile</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton className="text-base">
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="flex-grow" />
          </SidebarContent>
          <SidebarFooter>
            {user && <SidebarMenuButton asChild>
              <Link href="#">
                 <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.image || userAvatar?.imageUrl}
                      alt="User avatar"
                    />
                  <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className='w-full'>{user.name}</span>
              </Link>
            </SidebarMenuButton>}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <Header>
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden" />
              <h1 className="font-semibold text-lg md:text-2xl">
                Manage Movies
              </h1>
            </div>
          </Header>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {view === 'list' ? (
              <>
                <div className="flex items-center">
                  <h1 className="font-semibold text-lg md:text-2xl sr-only">Manage Movies</h1>
                  <AuthGuard requiredPermissions={[PERMISSIONS['post.create']]}>
                    <Button
                      className="ml-auto"
                      size="sm"
                      onClick={handleAddNewMovie}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Movie
                    </Button>
                  </AuthGuard>
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
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">
                            Year
                          </TableHead>
                          <TableHead>
                            <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleMovies.length > 0 ? (
                          visibleMovies.map((movie) => {
                            return (
                              <TableRow key={movie.id} className={movie.status === 'PENDING_DELETION' ? 'opacity-50' : ''}>
                                <TableCell className="hidden sm:table-cell">
                                  {movie.posterUrl ? (
                                    <Image
                                      alt={movie.title}
                                      className="aspect-square rounded-md object-cover"
                                      height="64"
                                      src={movie.posterUrl}
                                      width="64"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                      <ImageIcon />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  <Link
                                    href={`/movies/${movie.id}`}
                                    className="hover:underline"
                                  >
                                    {movie.title}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={movie.status === 'PUBLISHED' ? 'default' : 'destructive'}>{movie.status || 'PUBLISHED'}</Badge>
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
                                        <span className="sr-only">
                                          Toggle menu
                                        </span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                       <AuthGuard requiredPermissions={[PERMISSIONS['post.update']]}>
                                        <DropdownMenuItem
                                            onClick={() => handleEditMovie(movie)}
                                        >
                                            Edit
                                        </DropdownMenuItem>
                                       </AuthGuard>
                                       <AuthGuard requiredPermissions={[PERMISSIONS['post.delete']]}>
                                        <DropdownMenuItem
                                            onClick={() => handleDeleteMovie(movie)}
                                            className="text-destructive"
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                      </AuthGuard>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="h-24 text-center"
                            >
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setView('list')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold">
                      {editingMovie ? 'Edit Movie' : 'Add New Movie'}
                    </h1>
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
                                <FormLabel className="text-muted-foreground">Gallery Images</FormLabel>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {galleryImageIdsValue?.map((src, index) => (
                                        <div key={index} className="relative group aspect-square">
                                            <Image src={src} alt={`Gallery image ${index + 1}`} fill className="object-cover rounded-md" />
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
                                        className='aspect-square w-full h-full flex-col'
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
                              <FormLabel className="text-muted-foreground">
                                Year
                              </FormLabel>
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
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>

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
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

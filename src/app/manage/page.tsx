'use client';

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
import { getAllMovies } from '@/lib/data';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import type { Movie } from '@/lib/types';
import MovieForm from '@/components/movie-form';
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

const LOCAL_STORAGE_KEY = 'movies_data';

export default function ManageMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const storedMovies = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedMovies) {
      setMovies(JSON.parse(storedMovies));
    } else {
      const initialMovies = getAllMovies();
      setMovies(initialMovies);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialMovies));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(movies));
    }
  }, [movies, isMounted]);

  const handleAddNewMovie = () => {
    setEditingMovie(null);
    setDialogOpen(true);
  };

  const handleEditMovie = (movie: Movie) => {
    setEditingMovie(movie);
    setDialogOpen(true);
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

  const handleFormSubmit = (movieData: Movie) => {
    if (editingMovie) {
      // Edit
      setMovies(
        movies.map((m) => (m.id === movieData.id ? movieData : m))
      );
    } else {
      // Add
      setMovies([
        { ...movieData, id: movies.length + 1 * 100 },
        ...movies,
      ]);
    }
    setDialogOpen(false);
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="flex items-center">
            <h1 className="font-semibold text-lg md:text-2xl">Manage Movies</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Loading Movies...</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Please wait...</p>
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
          <div className="flex items-center">
            <h1 className="font-semibold text-lg md:text-2xl">Manage Movies</h1>
            <Button className="ml-auto" size="sm" onClick={handleAddNewMovie}>
              <PlusCircle className="h-4 w-4 mr-2" />
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
                  {movies.map((movie) => {
                    const poster = PlaceHolderImages.find(
                      (p) => p.id === movie.posterUrlId
                    );
                    return (
                      <TableRow key={movie.id}>
                        <TableCell className="hidden sm:table-cell">
                          {poster && (
                            <Image
                              alt={movie.title}
                              className="aspect-square rounded-md object-cover"
                              height="64"
                              src={poster.imageUrl}
                              width="64"
                              data-ai-hint={poster.imageHint}
                            />
                          )}
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
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      <MovieForm
        isOpen={dialogOpen}
        setIsOpen={setDialogOpen}
        onSubmit={handleFormSubmit}
        movie={editingMovie}
      />

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
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

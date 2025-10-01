'use client';

import React, { useState } from 'react';
import type { Movie } from '@prisma/client';
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, PlusCircle, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import AuthGuard from '@/components/auth/auth-guard';
import { PERMISSIONS, MovieStatus } from '@/lib/permissions';

interface MovieListProps {
  movies: Movie[];
  onAddNew: () => void;
  onEdit: (movie: Movie) => void;
  onDeleteConfirmed: (movieId: number) => void;
  onStatusChange: (movieId: number, newStatus: string) => void;
}

export default function MovieList({
  movies,
  onAddNew,
  onEdit,
  onDeleteConfirmed,
  onStatusChange,
}: MovieListProps) {
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);

  const handleDeleteClick = (movie: Movie) => {
    setMovieToDelete(movie);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (movieToDelete) {
      onDeleteConfirmed(movieToDelete.id);
    }
    setDeleteAlertOpen(false);
    setMovieToDelete(null);
  };

  const getStatusVariant = (status: string | null) => {
    switch (status) {
      case MovieStatus.PUBLISHED:
        return 'default';
      case MovieStatus.PENDING_APPROVAL:
        return 'secondary';
      case MovieStatus.PRIVATE:
        return 'outline';
      case MovieStatus.PENDING_DELETION:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Manage Movies</h1>
        <AuthGuard requiredPermissions={[PERMISSIONS['post.create']]}>
          <Button className="ml-auto" size="sm" onClick={onAddNew}>
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
                <TableHead className="hidden md:table-cell">Year</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movies.length > 0 ? (
                movies.map((movie) => (
                  <TableRow
                    key={movie.id}
                    className={
                      movie.status === MovieStatus.PENDING_DELETION
                        ? 'opacity-50'
                        : ''
                    }
                  >
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
                      <Badge variant={getStatusVariant(movie.status)}>
                        {movie.status || 'DRAFT'}
                      </Badge>
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
                          <AuthGuard
                            requiredPermissions={[PERMISSIONS['post.update']]}
                          >
                            <DropdownMenuItem onClick={() => onEdit(movie)}>
                              Edit
                            </DropdownMenuItem>
                          </AuthGuard>

                          <AuthGuard requiredPermissions={[PERMISSIONS['post.change_status']]}>
                             <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                Change Status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  <DropdownMenuRadioGroup
                                    value={movie.status || ''}
                                    onValueChange={(newStatus) =>
                                      onStatusChange(movie.id, newStatus)
                                    }
                                  >
                                    {Object.values(MovieStatus).map((status) => (
                                      <DropdownMenuRadioItem
                                        key={status}
                                        value={status}
                                      >
                                        {status}
                                      </DropdownMenuRadioItem>
                                    ))}
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                          </AuthGuard>
                          
                          <AuthGuard
                            requiredPermissions={[PERMISSIONS['post.delete']]}
                          >
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(movie)}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </AuthGuard>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
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
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will affect the movie &quot;
              {movieToDelete?.title}&quot;.
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

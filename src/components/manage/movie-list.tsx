
'use client';

import React from 'react';
import type { Post, User } from '@prisma/client';
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
import { MoreHorizontal, PlusCircle, Image as ImageIcon, RefreshCw, Eye, ThumbsUp, ListFilter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import AuthGuard from '@/components/auth/auth-guard';
import { PERMISSIONS, MovieStatus } from '@/lib/permissions';
import { Skeleton } from '../ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import ClientSideDate from './client-side-date';

type MovieWithDetails = Post & { author: User, _count: { likedBy: number } };

interface MovieListProps {
  movies: MovieWithDetails[];
  onAddNew: () => void;
  onEdit: (movie: MovieWithDetails) => void;
  onDeleteConfirmed: (movieId: number) => void;
  onStatusChange: (movieId: number, newStatus: string) => void;
  onRefresh: () => void;
  onFilterChange: (status: string | null) => void;
  isRefreshing: boolean;
  statusChangingMovieId: number | null;
  currentFilter: string | null;
}

export default function MovieList({
  movies,
  onAddNew,
  onEdit,
  onDeleteConfirmed,
  onStatusChange,
  onRefresh,
  onFilterChange,
  isRefreshing,
  statusChangingMovieId,
  currentFilter,
}: MovieListProps) {
  const [deleteAlertOpen, setDeleteAlertOpen] = React.useState(false);
  const [movieToDelete, setMovieToDelete] = React.useState<MovieWithDetails | null>(null);

  const handleDeleteClick = (movie: MovieWithDetails) => {
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
        <AuthGuard
          requiredPermissions={[PERMISSIONS['post.create']]}
          fallback={<Skeleton className="ml-auto h-9 w-[150px] rounded-full" />}
        >
          <Button className="ml-auto" size="sm" onClick={onAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Movie
          </Button>
        </AuthGuard>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Movies</CardTitle>
              <CardDescription>
                A list of all movies in the catalog.
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              {isRefreshing ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <ListFilter className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        {currentFilter ? `Filter: ${currentFilter}` : "Filter Status"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={currentFilter || 'ALL'} onValueChange={(value) => onFilterChange(value === 'ALL' ? null : value)}>
                      <DropdownMenuRadioItem value="ALL">All</DropdownMenuRadioItem>
                      {Object.values(MovieStatus).map(status => (
                        <DropdownMenuRadioItem key={status} value={status}>{status}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button variant="outline" size="icon" onClick={onRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Stats</TableHead>
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
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {movie.posterUrl ? (
                          <Image
                            alt={movie.title}
                            className="aspect-square rounded-md object-cover flex-shrink-0"
                            height="40"
                            src={movie.posterUrl}
                            width="40"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground flex-shrink-0">
                            <ImageIcon />
                          </div>
                        )}
                        <Link
                          href={`/movies/${movie.id}`}
                          className="hover:underline line-clamp-2"
                        >
                          {movie.title}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 hidden sm:flex">
                          <AvatarImage src={movie.author.image || ''} alt={movie.author.name || ''} />
                          <AvatarFallback>{movie.author.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{movie.author.name}</div>
                          <div className="text-xs text-muted-foreground hidden md:block">{movie.author.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {statusChangingMovieId === movie.id ? (
                        <Skeleton className="h-5 w-24 rounded-full" />
                      ) : (
                        <Badge variant={getStatusVariant(movie.status)}>
                          {movie.status || 'DRAFT'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <ClientSideDate date={movie.createdAt} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-right">
                      <div className="flex justify-end items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{movie.viewCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{movie._count.likedBy}</span>
                        </div>
                      </div>
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
                              <DropdownMenuSubTrigger disabled={statusChangingMovieId === movie.id}>
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    No movies found for the selected filter.
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

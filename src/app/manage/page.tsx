
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Header from "@/components/header";
import { getAllMovies } from "@/lib/data";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";

export default function ManageMoviesPage() {
  const movies = getAllMovies();

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
            <h1 className="font-semibold text-lg md:text-2xl">Manage Movies</h1>
            <Button className="ml-auto" size="sm">
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
                  const poster = PlaceHolderImages.find(p => p.id === movie.posterUrlId);
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
                      <TableCell className="font-medium">{movie.title}</TableCell>
                      <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {movie.genres.map(genre => (
                                <Badge key={genre} variant="outline">{genre}</Badge>
                            ))}
                          </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{movie.year}</TableCell>
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
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
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
  );
}

'use client';

import Image from 'next/image';
import {
  Star,
  MessageCircle,
  Download,
  Bot,
  Bookmark,
  MoreHorizontal,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/header';
import ReviewCard from '@/components/review-card';
import ReviewForm from '@/components/review-form';
import SubtitleRequestForm from '@/components/subtitle-request-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import React, { useEffect, useState } from 'react';
import type { Movie } from '@/lib/types';
import Loading from './loading';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import UploadSubtitleDialog from '@/components/upload-subtitle-dialog';
import MovieRecommendations from '@/components/movie-recommendations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const LOCAL_STORAGE_KEY = 'movies_data';

export default function MoviePage({ params }: { params: { id: string } }) {
  const { id: movieId } = React.use(params);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedMovies = localStorage.getItem(LOCAL_STORAGE_KEY);
      const allMovies = storedMovies ? JSON.parse(storedMovies) : [];
      const currentMovie = allMovies.find((m: Movie) => m.id === Number(movieId));
      setMovie(currentMovie || null);
    } catch (error) {
      console.error("Could not parse movies from localStorage", error);
      setMovie(null);
    }
  }, [movieId]);

  if (!isMounted) {
    return <Loading />;
  }

  if (!movie) {
    return (
       <div className="min-h-screen w-full bg-background">
        <Header />
        <main className="container mx-auto flex h-[calc(100vh-4rem)] items-center justify-center text-center">
            <div>
              <h1 className="font-serif text-3xl font-bold">Movie not found</h1>
              <p className="mt-2 text-muted-foreground">The movie you are looking for does not exist.</p>
            </div>
        </main>
      </div>
    )
  }
  
  const heroImage = movie.posterUrl || 
    (movie.galleryImageIds && movie.galleryImageIds.length > 0
      ? PlaceHolderImages.find((img) => img.id === movie.galleryImageIds[0])?.imageUrl
      : PlaceHolderImages.find((img) => img.id === 'movie-poster-placeholder')?.imageUrl);

  const authorAvatar = PlaceHolderImages.find(img => img.id === 'avatar-1');

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article>
          <header className="mb-8">
            {heroImage && (
              <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
                <Image
                    src={heroImage}
                    alt={`Poster for ${movie.title}`}
                    fill
                    className="object-cover"
                    priority
                />
              </div>
            )}
            
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
              {movie.title}
            </h1>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-8">
                <div className='flex items-center gap-4'>
                    <Avatar>
                        {authorAvatar && <AvatarImage src={authorAvatar.imageUrl} alt="Author" data-ai-hint={authorAvatar.imageHint} />}
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-foreground">CineVerse Editor</p>
                        <div className='flex items-center gap-2'>
                           <span>{movie.year}</span>
                           <span>&middot;</span>
                           <span>{movie.duration}</span>
                        </div>
                    </div>
                </div>
            </div>

            <Separator />
            <div className='flex items-center justify-between py-2 text-muted-foreground'>
                <div className='flex items-center gap-4'>
                    <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-400" />
                        <span>{movie.imdbRating.toFixed(1)}</span>
                    </div>
                     <div className="flex items-center gap-1">
                        <MessageCircle className="w-5 h-5" />
                        <span>{movie.reviews.length}</span>
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                    <Button variant="ghost" size="icon"><Bookmark className='w-5 h-5' /></Button>
                    <Button variant="ghost" size="icon"><MoreHorizontal className='w-5 h-5' /></Button>
                </div>
            </div>
            <Separator />

          </header>

          <div
            className="prose prose-invert max-w-none mx-auto text-foreground/80"
            dangerouslySetInnerHTML={{ __html: movie.description }}
          />

          <div className="my-8 flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <Badge key={genre} variant="outline" className="text-sm">
                {genre}
              </Badge>
            ))}
          </div>
        </article>

        <Separator className="my-12" />

        <section id="subtitles" className="my-12">
            <h2 className="font-serif text-3xl font-bold mb-6">Subtitles</h2>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="space-y-4">
                    {movie.subtitles.length > 0 ? movie.subtitles.map((subtitle) => (
                    <div
                        key={subtitle.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                    >
                        <div>
                        <p className="font-semibold">{subtitle.language}</p>
                        <p className="text-sm text-muted-foreground">
                            by {subtitle.uploader}
                        </p>
                        </div>
                        <div className="flex items-center space-x-4">
                        <span className="text-sm font-semibold text-primary">
                            {subtitle.price === 0
                            ? 'Free'
                            : `$${subtitle.price.toFixed(2)}`}
                        </span>
                        <Button variant="ghost" size="icon">
                            <Download className="h-5 w-5" />
                        </Button>
                        </div>
                    </div>
                    )) : <p className="text-muted-foreground">No subtitles available for this movie yet.</p>}
                </div>
                <div className="mt-6 flex">
                    <UploadSubtitleDialog />
                </div>
              </div>
              <div>
                <Card className="bg-card/50 sticky top-24">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      AI Subtitle Request
                    </CardTitle>
                    <CardDescription>
                      Can't find a language? Let our AI check if we can generate it.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SubtitleRequestForm movieTitle={movie.title} />
                  </CardContent>
                </Card>
              </div>
            </div>
        </section>

        <Separator className="my-12" />

        <section id="reviews" className="my-12">
            <h2 className="font-serif text-3xl font-bold mb-6">Responses ({movie.reviews.length})</h2>
             <div className="space-y-8">
                {movie.reviews.length > 0 ? movie.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
                )) : <p className="text-muted-foreground">Be the first to share your thoughts!</p>}
            </div>
            <Separator className="my-8"/>
            <ReviewForm />
        </section>

        <Separator className="my-12" />

        <section id="recommendations" className="my-12">
          <h2 className="font-serif text-3xl font-bold mb-6">More from CineVerse</h2>
          <MovieRecommendations currentMovie={movie} />
        </section>

      </main>
    </div>
  );
}

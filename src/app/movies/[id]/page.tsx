'use client';

import Image from 'next/image';
import {
  Star,
  MessageCircle,
  Download,
  Bot,
  Bookmark,
  MoreHorizontal,
  Share2,
  BookText,
  ListVideo,
  ThumbsUp,
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
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const LOCAL_STORAGE_KEY = 'movies_data';

export default function MoviePage() {
  const params = useParams();
  const movieId = params.id as string;
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedMovies = localStorage.getItem(LOCAL_STORAGE_KEY);
      const allMovies = storedMovies ? JSON.parse(storedMovies) : [];
      const currentMovie = allMovies.find(
        (m: Movie) => m.id === Number(movieId)
      );
      setMovie(currentMovie || null);
    } catch (error) {
      console.error('Could not parse movies from localStorage', error);
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
            <p className="mt-2 text-muted-foreground">
              The movie you are looking for does not exist.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const heroImage =
    movie.galleryImageIds && movie.galleryImageIds.length > 0
      ? movie.galleryImageIds[0]
      : movie.posterUrl
      ? movie.posterUrl
      : PlaceHolderImages.find((img) => img.id === 'movie-poster-placeholder')
          ?.imageUrl;

  const sideImage1 = PlaceHolderImages.find((img) => img.id === 'avatar-2');
  const sideImage2 = PlaceHolderImages.find((img) => img.id === 'avatar-3');

  const authorAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-1');

  const tabButtonStyle =
    'flex items-center gap-2 cursor-pointer transition-colors hover:text-foreground pb-3 border-b-2';
  const activeTabButtonStyle = 'text-primary font-semibold border-primary';
  const inactiveTabButtonStyle = 'border-transparent';

  const hasGallery = movie.galleryImageIds && movie.galleryImageIds.length > 0;

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <article>
          <header className="mb-8 relative h-[500px] rounded-2xl overflow-hidden flex items-end justify-between">
            {hasGallery ? (
              <Carousel className="w-full h-full">
                <CarouselContent>
                  {movie.galleryImageIds.map((src, index) => (
                    <CarouselItem key={index}>
                      <Image
                        src={src}
                        alt={`Gallery image ${index + 1} for ${movie.title}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            ) : (
              heroImage && (
                <Image
                  src={heroImage}
                  alt={`Poster for ${movie.title}`}
                  fill
                  className="object-cover"
                  priority
                />
              )
            )}
            {sideImage1 && (
              <Image
                src={sideImage1.imageUrl}
                alt="Side image 1"
                fill
                className="object-cover absolute -left-1/2 -translate-x-1/2 opacity-30 blur-md"
                data-ai-hint={sideImage1.imageHint}
              />
            )}
            {sideImage2 && (
              <Image
                src={sideImage2.imageUrl}
                alt="Side image 2"
                fill
                className="object-cover absolute -right-1/2 translate-x-1/2 opacity-30 blur-md"
                data-ai-hint={sideImage2.imageHint}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />

            <div className="relative z-10 text-foreground flex flex-col items-start text-left p-8 max-w-4xl w-full">
              <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-4">
                {movie.title}
              </h1>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-8">
                <Link href="/profile/cineverse-editor" className='flex items-center gap-4 group'>
                  <Avatar>
                    {authorAvatar && (
                      <AvatarImage
                        src={authorAvatar.imageUrl}
                        alt="Author"
                        data-ai-hint={authorAvatar.imageHint}
                      />
                    )}
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-foreground group-hover:text-primary">CineVerse Editor</p>
                    <div className="flex items-center gap-2">
                      <span>{movie.year}</span>
                      <span>&middot;</span>
                      <span>{movie.duration}</span>
                    </div>
                  </div>
                </Link>
              </div>

              <Separator className="my-4 bg-border/20" />
              <div className="flex items-center justify-between py-2 text-muted-foreground w-full">
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setActiveTab('about')}
                    className={cn(
                      tabButtonStyle,
                      activeTab === 'about'
                        ? activeTabButtonStyle
                        : inactiveTabButtonStyle
                    )}
                  >
                    <Image
                      src="/imdb.png"
                      alt="IMDb"
                      width={40}
                      height={20}
                    />
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="text-foreground">
                        {movie.imdbRating.toFixed(1)}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={cn(
                      tabButtonStyle,
                      activeTab === 'reviews'
                        ? activeTabButtonStyle
                        : inactiveTabButtonStyle
                    )}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-foreground">
                      {movie.reviews.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('subtitles')}
                    className={cn(
                      tabButtonStyle,
                      activeTab === 'subtitles'
                        ? activeTabButtonStyle
                        : inactiveTabButtonStyle
                    )}
                  >
                    <ListVideo className="w-5 h-5" />
                    <span className="text-foreground">Subtitles</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Bookmark className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <Tabs value={activeTab} className="mt-12 max-w-4xl mx-auto">
            <TabsContent value="about">
              <div
                className="prose prose-invert max-w-none text-foreground/80 mt-6"
                dangerouslySetInnerHTML={{ __html: movie.description }}
              />
              <div className="my-8 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <Badge key={genre} variant="outline" className="text-sm">
                    {genre}
                  </Badge>
                ))}
              </div>
              <Separator className="my-8" />
              <section id="recommendations">
                <h2 className="font-serif text-3xl font-bold mb-8">
                  More Like This
                </h2>
                <MovieRecommendations currentMovie={movie} />
              </section>
            </TabsContent>
            <TabsContent value="reviews">
              <section id="reviews" className="my-12">
                <h2 className="font-serif text-3xl font-bold mb-6">
                  Responses ({movie.reviews.length})
                </h2>
                <div className="space-y-8">
                  {movie.reviews.length > 0 ? (
                    movie.reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      Be the first to share your thoughts!
                    </p>
                  )}
                </div>
                <Separator className="my-8" />
                <ReviewForm />
              </section>
            </TabsContent>
            <TabsContent value="subtitles">
              <section id="subtitles" className="my-12">
                <h2 className="font-serif text-3xl font-bold mb-6">
                  Subtitles
                </h2>
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <div className="space-y-4">
                      {movie.subtitles.length > 0 ? (
                        movie.subtitles.map((subtitle) => (
                          <div
                            key={subtitle.id}
                            className="flex items-center justify-between rounded-lg border p-4"
                          >
                            <div>
                              <p className="font-semibold">
                                {subtitle.language}
                              </p>
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
                        ))
                      ) : (
                        <p className="text-muted-foreground">
                          No subtitles available for this movie yet.
                        </p>
                      )}
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
                          Can't find a language? Let our AI check if we can
                          generate it.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <SubtitleRequestForm movieTitle={movie.title} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </article>
      </main>
    </div>
  );
}

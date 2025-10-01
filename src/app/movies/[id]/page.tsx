import { notFound } from 'next/navigation';
import { getMovie } from '@/lib/actions';
import type { Movie, Review, Subtitle } from '@/lib/types';
import MovieDetailClient from './movie-detail-client';
import { TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import ReviewCard from '@/components/review-card';
import ReviewForm from '@/components/review-form';
import UploadSubtitleDialog from '@/components/upload-subtitle-dialog';
import SubtitleRequestForm from '@/components/subtitle-request-form';
import MovieRecommendations from '@/components/movie-recommendations';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Download } from 'lucide-react';
import React from 'react';


export default async function MoviePage({
  params,
}: {
  params: { id: string };
}) {
  const movieId = Number(params.id);
  if (isNaN(movieId)) {
    notFound();
  }

  const movie = (await getMovie(movieId)) as Movie | null;

  if (!movie) {
    notFound();
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <main className="max-w-6xl mx-auto py-8">
        <div className="px-4 md:px-8 mb-8">
            <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre: string) => (
                    <Badge key={genre} variant="outline" className="text-sm">
                    {genre}
                    </Badge>
                ))}
            </div>
        </div>
        <article>
          <MovieDetailClient movie={movie}>
            <TabsContent value="about">
              <div
                className="prose prose-invert max-w-none text-foreground/80"
                dangerouslySetInnerHTML={{ __html: movie.description }}
              />
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
                    movie.reviews.map((review: Review) => (
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
                        movie.subtitles.map((subtitle: Subtitle) => (
                          <div
                            key={subtitle.id}
                            className="flex items-center justify-between rounded-lg border p-4"
                          >
                            <div>
                              <p className="font-semibold">
                                {subtitle.language}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                by {subtitle.uploaderName}
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
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
          </MovieDetailClient>
        </article>
      </main>
    </div>
  );
}

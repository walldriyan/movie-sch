import Image from 'next/image';
import {
  Star,
  Heart,
  Eye,
  MessageCircle,
  Download,
  Upload,
  Clapperboard,
  Bot,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getMovieById } from '@/lib/data';
import type { Review, Subtitle } from '@/lib/types';
import Header from '@/components/header';
import RatingStars from '@/components/rating-stars';
import ReviewCard from '@/components/review-card';
import ReviewForm from '@/components/review-form';
import SubtitleRequestForm from '@/components/subtitle-request-form';
import MovieRecommendations from '@/components/movie-recommendations';
import UploadSubtitleDialog from '@/components/upload-subtitle-dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function MoviePage() {
  const movie = getMovieById(1);
  if (!movie) {
    return <div>Movie not found</div>;
  }

  const moviePoster = PlaceHolderImages.find((img) => img.id === movie.posterUrlId);

  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
      <div className="relative -mt-16 h-[560px] w-full overflow-hidden">
        {moviePoster && (
          <Image
            src={moviePoster.imageUrl}
            alt={`Poster for ${movie.title}`}
            fill
            className="object-cover"
            data-ai-hint={moviePoster.imageHint}
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      <main className="container mx-auto -mt-[340px] px-4 pb-8">
        <section className="relative z-10 -mt-20 mb-12 flex">
          <div className="w-full max-w-3xl space-y-4 p-4 md:p-8">
            <h1 className="font-headline text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              {movie.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{movie.year}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{movie.duration}</span>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex space-x-2">
                {movie.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="max-w-none whitespace-pre-line text-foreground/80 leading-relaxed tracking-wide">{movie.description}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center space-x-2">
                <Star className="text-yellow-400" />
                <span className="font-bold">{movie.imdbRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/ 10</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="text-accent" />
                <span className="font-bold">
                  {(movie.viewCount / 1000000).toFixed(1)}M
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="text-red-500" />
                <span className="font-bold">
                  {(movie.likes / 1000).toFixed(1)}k
                </span>
              </div>
            </div>
            <div className="pt-4 flex space-x-4">
              <Button size="lg" variant="default" className="bg-primary hover:bg-primary/90">
                <Clapperboard className="mr-2 h-5 w-5" />
                Watch Now
              </Button>
              <Button size="lg" variant="outline">
                <Heart className="mr-2 h-5 w-5" />
                Favorite
              </Button>
            </div>
          </div>
        </section>

        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-1/2 lg:w-1/3">
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="subtitles">Subtitles</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>User Reviews</CardTitle>
                <CardDescription>
                  What others are saying about {movie.title}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {movie.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
                <Separator />
                <ReviewForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subtitles">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Subtitles</CardTitle>
                    <CardDescription>
                      Download subtitles in your preferred language.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {movie.subtitles.map((subtitle) => (
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
                            <span className="text-sm font-semibold text-accent">
                              {subtitle.price === 0
                                ? 'Free'
                                : `$${subtitle.price.toFixed(2)}`}
                            </span>
                            <Button variant="ghost" size="icon">
                              <Download className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <UploadSubtitleDialog />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card className="bg-card/50 sticky top-24">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-6 w-6 text-primary" />
                      Request Subtitles
                    </CardTitle>
                    <CardDescription>
                      Can't find your language? Let our AI check if we can generate it
                      for you.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SubtitleRequestForm movieTitle={movie.title} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Recommendations</CardTitle>
                <CardDescription>
                  Movies you might like based on {movie.title}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MovieRecommendations currentMovie={movie} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

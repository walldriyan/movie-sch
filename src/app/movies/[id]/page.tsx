
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

export default function MoviePage({ params }: { params: { id: string } }) {
  const movie = getMovieById(Number(params.id));
  if (!movie) {
    return <div>Movie not found</div>;
  }

  const moviePoster = PlaceHolderImages.find((img) => img.id === movie.posterUrlId);
  const heroImage = PlaceHolderImages.find((img) => img.id === movie.posterUrlId);
  const galleryImages = movie.galleryImageIds.map(id => PlaceHolderImages.find(img => img.id === id)).filter(Boolean);


  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
       <div className="relative -mt-16 h-[560px] w-full">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-2">
            <div className="col-span-2 row-span-2">
              {heroImage && (
                <div className="relative h-full w-full overflow-hidden rounded-lg">
                <Image
                    src={heroImage.imageUrl}
                    alt={`Poster for ${movie.title}`}
                    fill
                    className="object-cover"
                    data-ai-hint={heroImage.imageHint}
                    priority
                />
                </div>
              )}
            </div>
            {galleryImages[0] && (
              <div className="relative h-full w-full overflow-hidden rounded-lg">
                  <Image
                      src={galleryImages[0].imageUrl}
                      alt={`Image from ${movie.title} 1`}
                      fill
                      className="object-cover"
                      data-ai-hint={galleryImages[0].imageHint}
                  />
              </div>
            )}
            {galleryImages[1] && (
               <div className="relative h-full w-full overflow-hidden rounded-lg">
                    <Image
                        src={galleryImages[1].imageUrl}
                        alt={`Image from ${movie.title} 2`}
                        fill
                        className="object-cover"
                        data-ai-hint={galleryImages[1].imageHint}
                    />
                </div>
            )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
      </div>
      
      <main className="container relative mx-auto -mt-[490px] px-4 sm:px-6 md:px-12 pb-8">
        <div aria-hidden="true" className="absolute inset-0 -top-96 -z-10 overflow-hidden transform-gpu blur-3xl">
            <div
              className="relative left-[calc(50%-15rem)] aspect-[1155/678] w-[72.125rem] -translate-x-1/4 rotate-[30deg] bg-gradient-to-tr from-primary/40 to-accent/20 opacity-50 sm:left-[calc(50%-40rem)] sm:w-[90.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
        </div>

        <section className="relative z-10 mb-12 flex flex-col md:flex-row items-start gap-8 -mt-20">
          <div className="w-full md:w-[200px] flex-shrink-0 mx-auto">
              <div className="relative mx-auto h-[300px] w-[200px] overflow-hidden rounded-lg shadow-2xl md:mx-0">
                  {moviePoster && (
                      <Image
                      src={moviePoster.imageUrl}
                      alt={`Poster for ${movie.title}`}
                      fill
                      className="object-cover"
                      data-ai-hint={moviePoster.imageHint}
                      />
                  )}
              </div>
              <div className="mt-4 space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <Star className="text-yellow-400" />
                  <span className="font-bold">{movie.imdbRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/ 10</span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <Eye className="text-accent" />
                  <span className="font-bold">
                    {(movie.viewCount / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <Heart className="text-red-500" />
                  <span className="font-bold">
                    {(movie.likes / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
          </div>

          <div className="w-full space-y-4 pt-0 md:pt-8">
            <h1 className="font-headline text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              {movie.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{movie.year}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{movie.duration}</span>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-background to-secondary/20 blur-2xl opacity-80"></div>
              <div className="max-w-none text-foreground/80 leading-relaxed tracking-wide whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: movie.description.replace(/\n/g, '<br />') }}
              />
            </div>
            <div className="pt-4 flex justify-start space-x-4">
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


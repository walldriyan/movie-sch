import { notFound } from 'next/navigation';
import { getMovie } from '@/lib/actions';
import type { Movie, Review, Subtitle, User } from '@/lib/types';
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
import { Button } from '@/components/ui/button';
import { Bot, Download, Tag, CalendarDays, Clock, User as UserIcon, Video, Star, ThumbsUp, Heart } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/auth';

const TagsSection = ({ genres }: { genres: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {genres.map((genre: string) => (
      <Button key={genre} variant="outline" size="sm" className="rounded-full">
        <Tag className="mr-2 h-4 w-4" />
        {genre}
      </Button>
    ))}
  </div>
);

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
  <div className="flex items-start gap-4">
    <div className="text-muted-foreground mt-1">{icon}</div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

const LikedByAvatars = ({ users }: { users: User[] }) => {
  const displayedUsers = users.slice(0, 5);

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">Be the first to like this.</p>;
  }

  return (
    <div className="flex items-center gap-2">
       <div className="flex -space-x-2 overflow-hidden">
        {displayedUsers.map((user, index) => (
            <Avatar key={user.id} className="h-7 w-7 border-2 border-background">
              <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
              <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {users.length > 5 ? `+${users.length - 5} more` : ''}
      </p>
    </div>
  );
};


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
  const session = await auth();
  const currentUser = session?.user;

  if (!movie) {
    notFound();
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <main className="max-w-6xl mx-auto pb-8 px-4 md:px-8">
        <article>
          <MovieDetailClient movie={movie} currentUser={currentUser}>
            <TabsContent value="about" className='px-4 md:px-0'>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                 <div className="md:col-span-3">
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
                 </div>

                 <aside className="md:col-span-1">
                    <Card className="sticky top-24 bg-card/50">
                       <CardHeader>
                        <CardTitle>Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <DetailItem icon={<CalendarDays className="h-5 w-5" />} label="Release Year" value={movie.year} />
                        <DetailItem icon={<Clock className="h-5 w-5" />} label="Duration" value={movie.duration} />
                        <DetailItem icon={<Video className="h-5 w-5" />} label="Director(s)" value={movie.directors || 'N/A'} />
                        <DetailItem icon={<UserIcon className="h-5 w-5" />} label="Main Cast" value={movie.mainCast || 'N/A'} />
                        
                        <Separator />
                        
                        <h4 className="font-semibold pt-2">Ratings</h4>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Image src="/imdb.png" alt="IMDb" width={32} height={16} />
                                <span className="font-bold">{movie.imdbRating.toFixed(1)}</span>
                            </div>
                             <div className="flex items-center gap-2 text-sm">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span>{movie.rottenTomatoesRating || 'N/A'}%</span>
                            </div>
                             <div className="flex items-center gap-2 text-sm">
                               <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 11.1h-9.2V16h5.28c-.45 1.6-1.9 2.7-3.73 2.7-2.2 0-4-1.8-4-4s1.8-4 4-4c1.08 0 2.05.4 2.8.9l2.7-2.7C18.6 6.3 16.5 5 14.15 5c-3.96 0-7.15 3.2-7.15 7.15s3.19 7.15 7.15 7.15c3.8 0 6.9-2.9 6.9-6.9 0-.6-.05-1.1-.15-1.6z"></path></svg>
                                <span>{movie.googleRating || 'N/A'}%</span>
                            </div>
                        </div>

                        <Separator />

                        <h4 className="font-semibold pt-2">Site Likes</h4>
                         <div className="flex items-center gap-2 text-foreground">
                            <Heart className="h-5 w-5 text-red-500 fill-red-500"/>
                            <span className="font-bold">{movie.likedBy.length}</span>
                        </div>
                        <LikedByAvatars users={movie.likedBy} />

                      </CardContent>
                    </Card>
                 </aside>

              </div>
            </TabsContent>
            <TabsContent value="reviews" className='px-4 md:px-0'>
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
            <TabsContent value="subtitles" className='px-4 md:px-0'>
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



import { notFound } from 'next/navigation';
import { getPost, canUserDownloadSubtitle, getUsers } from '@/lib/actions';
import type { Post, Review, Subtitle, User } from '@/lib/types';
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
import { Bot, Download, Tag, CalendarDays, Clock, User as UserIcon, Video, Star, Clapperboard, Images, Eye, ThumbsUp, MessageCircle, List, Lock } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import { auth } from '@/auth';
import AdminActions from '@/components/admin-actions';
import { PostType } from '@prisma/client';
import Link from 'next/link';

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

const TrailerSection = ({ post }: { post: Post }) => {
  const trailer = post.mediaLinks?.find(link => link.type === 'trailer');
  if (!trailer?.url) {
    return null;
  }

  const getYouTubeVideoId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const videoId = getYouTubeVideoId(trailer.url);
  if (!videoId) {
    return null;
  }

  return (
    <>
      <Separator className="my-12" />
      <section id="trailer">
        <h2 className="font-serif text-3xl font-bold mb-8 flex items-center gap-3">
          <Clapperboard className="h-8 w-8 text-primary" />
          Trailer
        </h2>
        <div className="aspect-video w-full">
          <iframe
            className="w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </section>
    </>
  );
};

const ImageGallerySection = ({ post }: { post: Post }) => {
  const images = post.mediaLinks?.filter(link => link.type === 'image') || [];
  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <Separator className="my-12" />
      <section id="gallery">
        <h2 className="font-serif text-3xl font-bold mb-8 flex items-center gap-3">
          <Images className="h-8 w-8 text-primary" />
          Gallery
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={index} className="aspect-video relative overflow-hidden rounded-lg">
              <Image
                src={image.url}
                alt={`Gallery image ${index + 1} for ${post.title}`}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

type SubtitleWithPermission = Subtitle & { canDownload: boolean };

export default async function MoviePage({
  params,
}: {
  params: { id: string };
}) {
  const postId = Number(params.id);
  if (isNaN(postId)) {
    notFound();
  }

  const post = (await getPost(postId)) as Post | null;
  const session = await auth();
  const currentUser = session?.user;

  if (!post) {
    notFound();
  }

  const subtitlesWithPermissions: SubtitleWithPermission[] = await Promise.all(
    (post.subtitles || []).map(async (subtitle: any) => ({
      ...subtitle,
      canDownload: await canUserDownloadSubtitle(subtitle.id),
    }))
  );

  return (
    <div className="min-h-screen w-full bg-transparent">
      <main className="max-w-6xl mx-auto pb-8 px-4 md:px-8">
        <article>
          <MovieDetailClient post={post} currentUser={currentUser}>
            <TabsContent value="about" className='px-4 md:px-0'>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                 <div className="md:col-span-3">
                    {post.seriesId && post.series && (
                      <div className="mb-8 p-4 rounded-lg bg-card/50 border">
                        <h3 className="font-semibold flex items-center gap-2">
                          <List className="h-5 w-5 text-primary" />
                          Part of the series:
                           <Link href={`/series/${post.series.id}`} className="text-primary hover:underline">
                             {post.series.title}
                           </Link>
                           (Part {post.orderInSeries})
                        </h3>
                      </div>
                    )}
                    <div
                      className="prose prose-invert max-w-none text-foreground/80"
                      dangerouslySetInnerHTML={{ __html: post.description }}
                    />

                    <TrailerSection post={post} />
                    
                    <ImageGallerySection post={post} />

                    <Separator className="my-12" />
                    <section id="recommendations">
                      <h2 className="font-serif text-3xl font-bold mb-8">
                        More Like This
                      </h2>
                      <MovieRecommendations currentPost={post} />
                    </section>
                 </div>

                 <aside className="md:col-span-1">
                    <Card className="sticky top-24 bg-card/50">
                       <CardHeader>
                        <CardTitle>Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {post.type === 'MOVIE' || post.type === 'TV_SERIES' ? (
                          <>
                            <DetailItem icon={<CalendarDays className="h-5 w-5" />} label="Release Year" value={post.year || 'N/A'} />
                            <DetailItem icon={<Clock className="h-5 w-5" />} label="Duration" value={post.duration || 'N/A'} />
                            <DetailItem icon={<Video className="h-5 w-5" />} label="Director(s)" value={post.directors || 'N/A'} />
                            <DetailItem icon={<UserIcon className="h-5 w-5" />} label="Main Cast" value={post.mainCast || 'N/A'} />
                            
                            <Separator />
                            
                            <h4 className="font-semibold pt-2">Ratings</h4>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Image src="/imdb.png" alt="IMDb" width={32} height={16} />
                                    <span className="font-bold">{post.imdbRating?.toFixed(1) || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    <span>{post.rottenTomatoesRating || 'N/A'}%</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.35 11.1h-9.2V16h5.28c-.45 1.6-1.9 2.7-3.73 2.7-2.2 0-4-1.8-4-4s1.8-4 4-4c1.08 0 2.05.4 2.8.9l2.7-2.7C18.6 6.3 16.5 5 14.15 5c-3.96 0-7.15 3.2-7.15 7.15s3.19 7.15 7.15 7.15c3.8 0 6.9-2.9 6.9-6.9 0-.6-.05-1.1-.15-1.6z"></path></svg>
                                  <span>{post.googleRating || 'N/A'}%</span>
                                </div>
                            </div>
                          </>
                        ) : (
                          <>
                             <DetailItem icon={<Eye className="h-5 w-5" />} label="Views" value={post.viewCount.toLocaleString()} />
                             <DetailItem icon={<ThumbsUp className="h-5 w-5" />} label="Likes" value={post.likedBy?.length || 0} />
                             <DetailItem icon={<MessageCircle className="h-5 w-5" />} label="Comments" value={post.reviews.length} />
                          </>
                        )}
                      </CardContent>
                    </Card>
                 </aside>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className='px-4 md:px-0'>
              <section id="reviews" className="my-12">
                <h2 className="font-serif text-3xl font-bold mb-6">
                  Responses ({post.reviews.length})
                </h2>
                <div className="space-y-8">
                  {post.reviews.length > 0 ? (
                    post.reviews.map((review: Review) => (
                      <ReviewCard key={review.id} review={review} postId={post.id} />
                    ))
                  ) : (
                    <p className="text-muted-foreground">
                      Be the first to share your thoughts!
                    </p>
                  )}
                </div>
                <Separator className="my-8" />
                <ReviewForm postId={post.id} />
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
                      {subtitlesWithPermissions.length > 0 ? (
                        subtitlesWithPermissions.map((subtitle) => (
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
                              {subtitle.canDownload ? (
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={subtitle.url} download>
                                    <Download className="h-5 w-5" />
                                  </a>
                                </Button>
                              ) : (
                                <Lock className="h-5 w-5 text-muted-foreground" titleAccess="You don't have permission to download this file" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">
                          No subtitles available for this post yet.
                        </p>
                      )}
                    </div>
                    <div className="mt-6 flex">
                      <UploadSubtitleDialog postId={post.id} />
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
                        <SubtitleRequestForm movieTitle={post.title} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>
            </TabsContent>
          </MovieDetailClient>
          <AdminActions post={post} />
        </article>
      </main>
    </div>
  );
}

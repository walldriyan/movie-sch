
'use client';

import { notFound, useParams } from 'next/navigation';
import { getPost, canUserDownloadSubtitle, createReview, deleteReview, deleteSubtitle } from '@/lib/actions';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Bot, Download, Tag, CalendarDays, Clock, User as UserIcon, Video, Star, Clapperboard, Images, Eye, ThumbsUp, MessageCircle, List, Lock, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import AdminActions from '@/components/admin-actions';
import Link from 'next/link';
import { ROLES } from '@/lib/permissions';
import SponsoredAdCard from '@/components/sponsored-ad-card';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function MoviePage() {
  const params = useParams();
  const postId = Number(params.id);

  const [post, setPost] = useState<Post | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleWithPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isNaN(postId)) {
      notFound();
      return;
    }

    async function fetchPostData() {
      setIsLoading(true);
      const postData = (await getPost(postId)) as Post | null;
      
      if (!postData) {
        notFound();
        return;
      }
      
      const subtitlesWithPermissions: SubtitleWithPermission[] = await Promise.all(
        (postData.subtitles || []).map(async (subtitle: any) => ({
          ...subtitle,
          canDownload: await canUserDownloadSubtitle(subtitle.id),
        }))
      );
      
      setPost(postData);
      setSubtitles(subtitlesWithPermissions);
      setIsLoading(false);
    }

    fetchPostData();
  }, [postId]);

  if (isLoading || !post) {
     return (
       <div className="min-h-screen w-full bg-transparent">
         <header className="relative h-[500px] w-full rounded-b-2xl overflow-hidden flex items-end">
            <Skeleton className="absolute inset-0" />
         </header>
          <main className="max-w-6xl mx-auto pb-8 px-4 md:px-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="md:col-span-3 space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
              </div>
              <aside className="md:col-span-1">
                  <Skeleton className="h-64 w-full" />
              </aside>
            </div>
          </main>
       </div>
     )
  }
  
  return (
    <MoviePageContent 
        post={post}
        setPost={setPost}
        subtitles={subtitles}
        setSubtitles={setSubtitles}
    />
  );
}

function MoviePageContent({ post, setPost, subtitles, setSubtitles }: { post: Post, setPost: React.Dispatch<React.SetStateAction<Post | null>>, subtitles: SubtitleWithPermission[], setSubtitles: React.Dispatch<React.SetStateAction<SubtitleWithPermission[]>> }) {
    const [currentReviews, setCurrentReviews] = React.useState<Review[]>(post.reviews || []);
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [subtitleToDelete, setSubtitleToDelete] = React.useState<Subtitle | null>(null);
    const [isDeleting, startDeleteTransition] = React.useTransition();
    const [isSubmittingReview, startReviewTransition] = React.useTransition();
    const [showReviews, setShowReviews] = React.useState(false);
    const { data: session } = useSession();
    const currentUser = session?.user;

    useEffect(() => {
      if(post) {
        setCurrentReviews(post.reviews || []);
      }
    }, [post])

    const handleReviewSubmit = async (comment: string, rating: number, parentId?: number) => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "You must be logged in." });
            return;
        }
        
        startReviewTransition(async () => {
            const optimisticReview: Review = {
                id: Date.now(),
                comment,
                rating: parentId ? 0 : rating,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: currentUser.id,
                postId: post.id,
                parentId: parentId || null,
                user: currentUser as any,
                replies: [],
            };
            
            const originalReviews = currentReviews;

            if (parentId) {
                const addReply = (nodes: Review[]): Review[] => nodes.map(node => {
                    if (node.id === parentId) return { ...node, replies: [...(node.replies || []), optimisticReview] };
                    if (node.replies?.length) return { ...node, replies: addReply(node.replies) };
                    return node;
                });
                setCurrentReviews(prev => addReply(prev));
            } else {
                setCurrentReviews(prev => [optimisticReview, ...prev]);
            }

            try {
                const newReview = await createReview(post.id, comment, rating, parentId);
                const replaceOptimistic = (nodes: Review[]): Review[] => nodes.map(node => {
                    if (node.id === optimisticReview.id) return newReview;
                    if (node.replies?.length) return { ...node, replies: replaceOptimistic(node.replies) };
                    return node;
                });
                setCurrentReviews(prev => replaceOptimistic(prev));
                toast({ title: "Response Submitted!", description: "Thanks for sharing your thoughts." });
            } catch (error: any) {
                toast({ variant: "destructive", title: "Error", description: error.message || "Could not submit review." });
                setCurrentReviews(originalReviews);
            }
        });
    };

    const handleReviewDelete = async (reviewId: number) => {
        const originalReviews = [...currentReviews];
        const removeReviewFromTree = (nodes: Review[], idToRemove: number): Review[] => nodes.filter(node => node.id !== idToRemove).map(node => {
            if (node.replies?.length) return { ...node, replies: removeReviewFromTree(node.replies, idToRemove) };
            return node;
        });
        setCurrentReviews(prev => removeReviewFromTree(prev, reviewId));
        try {
            await deleteReview(reviewId);
            toast({ title: "Review Deleted", description: "The review has been removed." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete review." });
            setCurrentReviews(originalReviews);
        }
    };
    
    const handleUploadSuccess = (newSubtitle: SubtitleWithPermission) => {
        setSubtitles(prev => [...prev, newSubtitle]);
    };

    const handleDeleteClick = (subtitle: Subtitle) => {
        setSubtitleToDelete(subtitle);
        setDialogOpen(true);
    };
    
    const handleConfirmDelete = () => {
        if (!subtitleToDelete) return;
        startDeleteTransition(async () => {
            try {
                await deleteSubtitle(subtitleToDelete.id);
                toast({ title: "Subtitle Deleted", description: "The subtitle has been removed." });
                setSubtitles(subs => subs.filter(s => s.id !== subtitleToDelete.id));
            } catch (error: any) {
                toast({ variant: "destructive", title: "Error Deleting Subtitle", description: error.message });
            } finally {
                setDialogOpen(false);
                setSubtitleToDelete(null);
            }
        });
    };
    
    return (
        <div className="min-h-screen w-full bg-transparent">
          <main className="max-w-6xl mx-auto pb-8 px-4 md:px-8">
            <article>
              <MovieDetailClient post={post} setPost={setPost}>
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
                        <SponsoredAdCard />
                        <Separator className="my-12" />
                        <section id="recommendations">
                          <h2 className="font-serif text-3xl font-bold mb-8">
                            More Like This
                          </h2>
                          <MovieRecommendations currentPost={post} />
                        </section>
                     </div>
                     <aside className="md:col-span-1">
                        <div className="sticky top-24 space-y-6">
                          <Card className="bg-card/50">
                             <CardHeader>
                              <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              {post.type === 'MOVIE' || post.type === 'TV_SERIES' ? (
                                <>
                                  <DetailItem icon={<CalendarDays className="h-5 w-5" />} label="Release Year" value={post.year || 'N/A'} />
                                  <DetailItem icon={<Clock className="h-5 w-5" />} label="Duration" value={post.duration || 'N ạ'} />
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
                                   <DetailItem icon={<ThumbsUp className="h-5 w-5" />} label="Likes" value={post._count?.likedBy || 0} />
                                   <DetailItem icon={<MessageCircle className="h-5 w-5" />} label="Comments" value={currentReviews.length} />
                                </>
                              )}
                            </CardContent>
                          </Card>
                          <SponsoredAdCard />
                        </div>
                     </aside>
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className='px-4 md:px-0'>
                   <section id="reviews" className="my-12">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="font-serif text-3xl font-bold flex items-center gap-3">
                          <MessageCircle className="w-8 h-8 text-primary" />
                          Responses ({currentReviews.length})
                        </h2>
                        <Button variant="ghost" size="icon" onClick={() => setShowReviews(!showReviews)}>
                            {showReviews ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                        </Button>
                      </div>
                    {showReviews && (
                      <>
                        <ReviewForm 
                            postId={post.id} 
                            onSuccess={() => {}}
                            isSubmitting={isSubmittingReview}
                            onSubmitReview={handleReviewSubmit}
                        />
                        <Separator className="my-8" />
                        <div className="space-y-8">
                          {currentReviews.length > 0 ? (
                            currentReviews.map((review: Review) => (
                              <ReviewCard key={review.id} review={review} onReviewSubmit={handleReviewSubmit} onReviewDelete={handleReviewDelete} />
                            ))
                          ) : (
                            !isSubmittingReview && <p className="text-muted-foreground">Be the first to share your thoughts!</p>
                          )}
                        </div>
                      </>
                    )}
                  </section>
                </TabsContent>
                <TabsContent value="subtitles" className='px-4 md:px-0'>
                  <SponsoredAdCard />
                  <section id="subtitles" className="my-12">
                    <h2 className="font-serif text-3xl font-bold mb-6">
                      Subtitles
                    </h2>
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                      <div className="lg:col-span-2">
                        <div className="space-y-4">
                          {subtitles.length > 0 ? (
                            subtitles.map((subtitle) => {
                              const canDelete = currentUser?.role === ROLES.SUPER_ADMIN || currentUser?.name === subtitle.uploaderName;
                              const isCurrentlyDeleting = isDeleting && subtitleToDelete?.id === subtitle.id;
                              return (
                                <div key={subtitle.id} className="flex items-center justify-between rounded-lg border p-4">
                                  <div>
                                    <p className="font-semibold">{subtitle.language}</p>
                                    <p className="text-sm text-muted-foreground">by {subtitle.uploaderName}</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {subtitle.canDownload ? (
                                      <Button variant="ghost" size="icon" asChild>
                                        <a href={subtitle.url} download>
                                          <Download className="h-5 w-5" />
                                        </a>
                                      </Button>
                                    ) : (
                                      <Lock className="h-5 w-5 text-muted-foreground" title="You don't have permission to download this file" />
                                    )}
                                    {canDelete && (
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(subtitle)} disabled={isCurrentlyDeleting} title="Delete subtitle">
                                            {isCurrentlyDeleting ? <Loader2 className="h-5 w-5 animate-spin text-destructive" /> : <Trash2 className="h-5 w-5 text-destructive" />}
                                        </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <p className="text-muted-foreground">No subtitles available for this post yet.</p>
                          )}
                        </div>
                        <div className="mt-6 flex">
                          <UploadSubtitleDialog postId={post.id} onUploadSuccess={handleUploadSuccess} />
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
            
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the subtitle file for &quot;{subtitleToDelete?.language}&quot;.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Continue"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </main>
        </div>
    )
}

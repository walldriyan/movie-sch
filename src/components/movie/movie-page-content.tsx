
'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import type { Session } from 'next-auth';
import { createReview, deleteReview, deleteSubtitle, incrementViewCount } from '@/lib/actions';
import type { Post, Review, Subtitle } from '@/lib/types';
import MovieDetailClient from './movie-detail-client';
import { TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import ReviewCard from '@/components/review-card';
import ReviewForm from '@/components/review-form';
import UploadSubtitleDialog from '@/components/upload-subtitle-dialog';
import DOMPurify from 'isomorphic-dompurify';


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
import {
  Bot,
  Download,
  CalendarDays,
  Clock,
  User as UserIcon,
  Video,
  Star,
  Clapperboard,
  Images,
  Eye,
  ThumbsUp,
  MessageCircle,
  List,
  Lock,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookCheck,
  PlayCircle
} from 'lucide-react';
import Image from 'next/image';
import AdminActions from '@/components/admin-actions';
import Link from 'next/link';
import { ROLES } from '@/lib/permissions';
import SponsoredAdCard from '@/components/sponsored-ad-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PostViewsAndLikes from '@/components/post-views-and-likes';
import { motion, AnimatePresence } from 'framer-motion';

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
  <div className="flex items-start gap-4">
    <div className="text-muted-foreground mt-1">{icon}</div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

const TrailerSection = ({ post }: { post: any }) => {
  const trailer = post.mediaLinks?.find((link: any) => link.type === 'trailer');
  if (!trailer?.url) return null;

  const getYouTubeVideoId = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
      if (urlObj.hostname.includes('youtube.com')) return urlObj.searchParams.get('v');
      return null;
    } catch {
      return null;
    }
  };

  const videoId = getYouTubeVideoId(trailer.url);
  if (!videoId) return null;

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
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          />
        </div>
      </section>
    </>
  );
};

const ImageGallerySection = ({ post }: { post: any }) => {
  const images = post.mediaLinks?.filter((link: any) => link.type === 'image') || [];
  if (images.length === 0) return null;

  return (
    <>
      <Separator className="my-12" />
      <section id="gallery">
        <h2 className="font-serif text-3xl font-bold mb-8 flex items-center gap-3">
          <Images className="h-8 w-8 text-primary" />
          Gallery
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image: any, index: number) => (
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

const ExamSection = ({ exam }: { exam: { id: number; title: string; description: string | null } | null }) => {
  if (!exam) return null;

  return (
    <>
      <Separator className="my-12" />
      <section id="exam">
        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BookCheck className="h-6 w-6 text-primary" />
              Test Your Knowledge
            </CardTitle>
            <CardDescription>An exam is available for this content.</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg">{exam.title}</h3>
            {exam.description && <p className="text-muted-foreground mt-2">{exam.description}</p>}
            <Button asChild className="mt-4">
              <Link href={`/exams/${exam.id}`}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Start Exam
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
};



type SubtitleWithPermission = Subtitle & { canDownload: boolean };

export default function MoviePageContent({
  initialPost,
  initialSubtitles,
  session,
}: {
  initialPost: any;
  initialSubtitles: SubtitleWithPermission[];
  session: Session | null;
}) {
  const [post, setPost] = useState<any>(initialPost);
  const [viewCount, setViewCount] = useState(initialPost.viewCount);
  const [subtitles, setSubtitles] = useState<SubtitleWithPermission[]>(initialSubtitles);
  const [currentReviews, setCurrentReviews] = useState<any[]>(initialPost.reviews || []);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subtitleToDelete, setSubtitleToDelete] = useState<Subtitle | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isSubmittingReview, startReviewTransition] = useTransition();
  const [isUpdatingViewCount, startViewCountTransition] = useTransition();
  const [showReviews, setShowReviews] = useState(false);
  const currentUser = session?.user;
  const effectRan = useRef(false);

  const sanitizedDescription = DOMPurify.sanitize(post.description);

  useEffect(() => {
    let isMounted = true;
    if (process.env.NODE_ENV === 'production' || !effectRan.current) {
      startViewCountTransition(async () => {
        try {
          // We only call the server action, the UI is updated via `viewCount` state
          await incrementViewCount(initialPost.id);
        } catch (error) {
          console.error("Failed to update view count on server:", error);
        }
      });
    }

    // Cleanup function to set the ref back to false on unmount
    return () => {
      isMounted = false;
      if (process.env.NODE_ENV !== 'production') {
        effectRan.current = true;
      }
    };
  }, [initialPost.id]);

  // This effect syncs the view count when initialPost changes
  useEffect(() => {
    setViewCount(initialPost.viewCount + 1);
  }, [initialPost.viewCount]);


  useEffect(() => {
    if (post) {
      setCurrentReviews(post.reviews || []);
    }
  }, [post]);

  if (!post) {
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
    );
  }

  const handlePostUpdate = (updatedPost: Post) => {
    setPost(updatedPost);
  };

  const handleReviewSubmit = async (comment: string, rating: number, parentId?: number) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "You must be logged in." });
      return;
    }

    startReviewTransition(async () => {
      const optimisticReview: any = {
        id: Date.now(),
        comment,
        rating: parentId ? 0 : rating,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: currentUser.id,
        postId: post.id,
        parentId: parentId || null,
        user: currentUser,
        replies: [],
      };

      const originalReviews = currentReviews;

      if (parentId) {
        const addReply = (nodes: any[]): any[] => nodes.map(node => {
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
        const replaceOptimistic = (nodes: any[]): any[] => nodes.map(node => {
          if (node.id === optimisticReview.id) return newReview;
          if (node.replies?.length) return { ...node, replies: replaceOptimistic(node.replies) };
          return node;
        });
        setCurrentReviews(prev => replaceOptimistic(prev));
        toast({ title: "Response Submitted!", description: "Thanks for sharing your thoughts." });
      } catch (error) {
        setCurrentReviews(originalReviews);
        throw error;
      }
    });
  };

  const handleReviewDelete = async (reviewId: number) => {
    const originalReviews = [...currentReviews];
    const removeReviewFromTree = (nodes: any[], idToRemove: number): any[] =>
      nodes.filter(node => node.id !== idToRemove).map(node => {
        if (node.replies?.length) return { ...node, replies: removeReviewFromTree(node.replies, idToRemove) };
        return node;
      });

    setCurrentReviews(prev => removeReviewFromTree(prev, reviewId));

    try {
      await deleteReview(reviewId);
      toast({ title: "Review Deleted", description: "The review has been removed." });
    } catch (error) {
      setCurrentReviews(originalReviews);
      throw error;
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
      await deleteSubtitle(subtitleToDelete.id);
      toast({ title: "Subtitle Deleted", description: "The subtitle has been removed." });
      setSubtitles(subs => subs.filter(s => s.id !== subtitleToDelete.id));
      setDialogOpen(false);
      setSubtitleToDelete(null);
    });
  };

  return (
    <div className="min-h-screen w-full bg-transparent">
      <main className="max-w-6xl mx-auto pb-8 px-4 md:px-8">
        <article>
          <MovieDetailClient post={post} onPostUpdate={handlePostUpdate} session={session}>
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

                  {post.isContentLocked ? (
                    <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-16 border-2 border-dashed rounded-lg bg-muted/20">
                      <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">Content Locked</h3>
                      <p className="text-muted-foreground mt-2 max-w-sm">
                        This content is currently locked. You may need to join a group or complete a previous step in a series to view it.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="prose prose-invert max-w-none text-foreground/80"
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                    />
                  )}

                  {!post.isContentLocked && (
                    <>
                      <TrailerSection post={post} />
                      <ImageGallerySection post={post} />
                      <ExamSection exam={post.exam} />
                    </>
                  )}

                  <Separator className="my-12" />
                  <PostViewsAndLikes post={post} viewCount={viewCount} />
                  <Separator className="my-12" />
                  <SponsoredAdCard slotId="post_bottom" />
                  <Separator className="my-12" />
                  <section id="recommendations">
                    <h2 className="font-serif text-3xl font-bold mb-8">
                      More Like This
                    </h2>
                    {/* <MovieRecommendations currentPost={post} /> */}
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
                                <svg className="h-4 w-4" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M21.35 11.1h-9.2V16h5.28c-.45 1.6-1.9 2.7-3.73 2.7-2.2 0-4-1.8-4-4s1.8-4 4-4c1.08 0 2.05.4 2.8.9l2.7-2.7C18.6 6.3 16.5 5 14.15 5c-3.96 0-7.15 3.2-7.15 7.15s3.19 7.15 7.15 7.15c3.8 0 6.9-2.9 6.9-6.9 0-.6-.05-1.1-.15-1.6z" />
                                </svg>
                                <span>{post.googleRating || 'N/A'}%</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <DetailItem icon={<Eye className="h-5 w-5" />} label="Views" value={viewCount.toLocaleString()} />
                            <DetailItem icon={<ThumbsUp className="h-5 w-5" />} label="Likes" value={post._count?.likedBy || 0} />
                            <DetailItem icon={<MessageCircle className="h-5 w-5" />} label="Comments" value={currentReviews.length} />
                          </>
                        )}
                      </CardContent>
                    </Card>
                    <SponsoredAdCard slotId="post_sidebar" />
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
                    <motion.div animate={{ rotate: showReviews ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-6 h-6" />
                    </motion.div>
                  </Button>
                </div>

                <AnimatePresence initial={false}>
                  {showReviews && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <ReviewForm
                        postId={post.id}
                        isSubmitting={isSubmittingReview}
                        onSubmitReview={handleReviewSubmit}
                        session={session}
                      />
                      <Separator className="my-8" />
                      <div className="space-y-8">
                        {currentReviews.length > 0 ? (
                          currentReviews.map((review: any) => (
                            <ReviewCard
                              key={review.id}
                              review={review}
                              onReviewSubmit={handleReviewSubmit}
                              onReviewDelete={handleReviewDelete}
                              session={session}
                            />
                          ))
                        ) : (
                          !isSubmittingReview && (
                            <p className="text-muted-foreground">Be the first to share your thoughts!</p>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </TabsContent>

            <TabsContent value="subtitles" className='px-4 md:px-0'>
              <SponsoredAdCard slotId="post_subtitles" />
              <section id="subtitles" className="my-12">
                <h2 className="font-serif text-3xl font-bold mb-6">Subtitles</h2>
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
                                  <span title="You don't have permission to download this file">
                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                  </span>
                                )}
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(subtitle)}
                                    disabled={isCurrentlyDeleting}
                                    title="Delete subtitle"
                                  >
                                    {isCurrentlyDeleting ? (
                                      <Loader2 className="h-5 w-5 animate-spin text-destructive" />
                                    ) : (
                                      <Trash2 className="h-5 w-5 text-destructive" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
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
                        {/* <SubtitleRequestForm movieTitle={post.title} /> */}
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
  );
}

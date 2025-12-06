

'use client';

import { useRouter, useSearchParams, usePathname, useParams, redirect } from 'next/navigation';
import type { Post, Review, Series, User } from '@/lib/types';
import SeriesTracker from '@/components/series-tracker';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, List, UserPlus, MessageCircle, Eye, ThumbsUp, ThumbsDown, Bookmark, Download, Lock, ChevronDown, ChevronUp, BookCheck, PlayCircle, Loader2 } from 'lucide-react';
import { useEffect, useState, useMemo, useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import ReviewCard from '@/components/review-card';
import ReviewForm from '@/components/review-form';
import { useToast } from '@/hooks/use-toast';
import { toggleLikePost, toggleFavoritePost, createReview, deleteReview, updatePostLockSettings } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import SponsoredAdCard from '@/components/sponsored-ad-card';
import type { Session } from 'next-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ROLES } from '@/lib/permissions';
import PostViewsAndLikes from '@/components/post-views-and-likes';


const ExamSection = ({ exam }: { exam: { id: number; title: string; description: string | null } | null | undefined }) => {
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


export default function SeriesPageClient({
  series,
  postsInSeries,
  initialPost,
  session,
  passedExamIds,
}: {
  series: Series,
  postsInSeries: Post[],
  initialPost: Post,
  session: Session | null,
  passedExamIds: Set<number>,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const { toast } = useToast();
  const currentUser = session?.user;

  const [likeTransition, startLikeTransition] = useTransition();
  const [favoriteTransition, startFavoriteTransition] = useTransition();
  const [isSubmittingReview, startReviewTransition] = useTransition();
  const [lockSettingsTransition, startLockSettingsTransition] = useTransition();

  const [currentPost, setCurrentPost] = useState(initialPost);
  const [reviews, setReviews] = useState<Review[]>(initialPost.reviews);
  const [showReviews, setShowReviews] = useState(false);

  const [isLockedByDefault, setIsLockedByDefault] = useState(initialPost.isLockedByDefault);
  const [requiresExamToUnlock, setRequiresExamToUnlock] = useState(initialPost.requiresExamToUnlock);

  const author = postsInSeries[0]?.author;

  useEffect(() => {
    setCurrentPost(initialPost);
    setReviews(initialPost.reviews);
    setIsLockedByDefault(initialPost.isLockedByDefault || false);
    setRequiresExamToUnlock(initialPost.requiresExamToUnlock || false);
  }, [initialPost]);

  // heroImage is now defined in the return section for image error handling

  const handleLike = (like: boolean) => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to like or dislike a post.',
      });
      return;
    }
    startLikeTransition(() => {
      toggleLikePost(currentPost.id, like)
        .then(() => {
          toast({
            title: 'Success',
            description: `Your preference has been updated.`,
          });
          // Note: This won't re-render the like count immediately without more state management.
          // For a full optimistic update, we'd manage the post state here.
          router.refresh();
        })
        .catch((err) => {
          toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: err.message,
          });
        });
    });
  };

  const handleFavorite = () => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'You must be logged in to add a post to favorites.',
      });
      return;
    }
    startFavoriteTransition(() => {
      toggleFavoritePost(currentPost.id)
        .then(() => {
          toast({
            title: 'Favorites Updated',
            description: `Post has been ${isFavorited ? 'removed from' : 'added to'} your favorites.`,
          });
          router.refresh();
        })
        .catch((err) => {
          toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: err.message,
          });
        });
    });
  };

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
        postId: currentPost.id,
        parentId: parentId || null,
        user: currentUser as User,
        replies: [],
      };

      const originalReviews = reviews;

      if (parentId) {
        const addReply = (nodes: Review[]): Review[] => {
          return nodes.map(node => {
            if (node.id === parentId) {
              return { ...node, replies: [...(node.replies || []), optimisticReview] };
            }
            if (node.replies && node.replies.length > 0) {
              return { ...node, replies: addReply(node.replies) };
            }
            return node;
          });
        };
        setReviews(prev => addReply(prev));
      } else {
        setReviews(prev => [optimisticReview, ...prev]);
      }

      try {
        const newReview = await createReview(currentPost.id, comment, rating, parentId);

        const replaceOptimistic = (nodes: Review[]): Review[] => {
          return nodes.map(node => {
            if (node.id === optimisticReview.id) return newReview as Review;
            if (node.replies && node.replies.length > 0) {
              return { ...node, replies: replaceOptimistic(node.replies) };
            }
            return node;
          });
        };

        setReviews(prev => replaceOptimistic(prev));
        toast({ title: "Response Submitted!", description: "Thanks for sharing your thoughts." });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message || "Could not submit your review." });
        setReviews(originalReviews);
      }
    });
  };

  const handleReviewDelete = async (reviewId: number) => {
    const originalReviews = [...reviews];

    const removeReviewFromTree = (nodes: Review[], idToRemove: number): Review[] => {
      return nodes.filter(node => node.id !== idToRemove).map(node => {
        if (node.replies && node.replies.length > 0) {
          return { ...node, replies: removeReviewFromTree(node.replies, idToRemove) };
        }
        return node;
      });
    };
    setReviews(prevReviews => removeReviewFromTree(prevReviews, reviewId));

    try {
      await deleteReview(reviewId);
      toast({ title: "Review Deleted", description: "The review has been successfully removed." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete the review." });
      setReviews(originalReviews);
    }
  };

  const handleLockSettingsChange = () => {
    startLockSettingsTransition(async () => {
      try {
        await updatePostLockSettings(currentPost.id, isLockedByDefault, requiresExamToUnlock);
        toast({ title: 'Lock settings updated successfully' });
        router.refresh();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };


  const isFavorited = currentUser && currentPost.favoritePosts && currentPost.favoritePosts.some(fav => fav.userId === currentUser?.id);
  const isLiked = currentUser && currentPost.likedBy?.some(user => user.id === currentUser.id);
  const isDisliked = currentUser && currentPost.dislikedBy?.some(user => user.id === currentUser.id);
  const canManage = currentUser && (currentUser.id === author?.id || currentUser.role === ROLES.SUPER_ADMIN);

  // State for image error handling
  const [imgError, setImgError] = useState(false);
  const heroImage = currentPost.posterUrl;
  const hasHeroImage = heroImage && heroImage.trim() !== '' && !imgError;

  return (
    <div className="w-full bg-background text-foreground pt-[80px]">
      {/* Breadcrumb Navigation - Fixed at top left */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-3 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <span className="text-white/30">/</span>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 px-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white gap-2"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <span className="text-white/30">/</span>
          <span className="text-white/50">Series</span>
          <span className="text-white/30">/</span>
          <span className="text-white truncate max-w-[200px]">{series.title}</span>
        </nav>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-3">
            <article>
              <div className="relative h-[400px] w-full rounded-xl overflow-hidden mb-8">
                {/* Hero Image or Gradient Fallback */}
                {hasHeroImage ? (
                  <Image
                    src={heroImage}
                    alt={`Poster for ${currentPost.title}`}
                    fill
                    className="object-cover"
                    priority
                    onError={() => setImgError(true)}
                  />
                ) : (
                  // Dark gradient background when no image or image failed
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
                  </div>
                )}

                {/* Gradient mask */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

                {/* Follow button with image */}
                <div className="absolute bottom-2 right-2 h-[100px] w-auto flex items-center justify-center">
                  {author && (
                    <div className="flex flex-col items-end gap-3 mt-3 w-full text-right">
                      <div className="flex flex-row-reverse items-center gap-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={author.image || ''} alt={author.name || ''} />
                          <AvatarFallback>{author.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-lg font-medium">{author.name}</span>
                      </div>

                      <Button variant="outline" size="sm" className="flex flex-row-reverse">
                        <UserPlus className="ml-2 h-4 w-4" />
                        Follow
                      </Button>
                    </div>
                  )}

                </div>

              </div>

              <h2 className="text-4xl font-bold font-serif mb-4">{currentPost.title}</h2>

              {(currentPost as any).isLocked ? (
                <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-16 border-2 border-dashed rounded-lg bg-muted/20">
                  <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Content Locked</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    This part of the series is currently locked. You may need to complete a previous step to unlock it.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="prose prose-lg prose-invert max-w-none text-foreground/80"
                    dangerouslySetInnerHTML={{ __html: currentPost.description }}
                  />
                </>
              )}

              {!(currentPost as any).isLocked && (
                <>
                  <Separator className="my-12" />

                  <section id="interactions" className="flex items-center justify-between text-muted-foreground mb-12">
                    <PostViewsAndLikes post={currentPost} viewCount={currentPost.viewCount || 0} />
                    <div className="flex items-center gap-2 pl-4 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleLike(true)} disabled={likeTransition} title={isLiked ? 'Unlike' : 'Like'}>
                        <ThumbsUp className={cn("w-5 h-5", isLiked && "text-primary fill-primary")} />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => handleLike(false)} disabled={likeTransition} title={isDisliked ? 'Remove dislike' : 'Dislike'}>
                        <ThumbsDown className={cn("w-5 h-5", isDisliked && "text-destructive fill-destructive")} />
                      </Button>

                      <Separator orientation="vertical" className="h-6 mx-2" />

                      <Button variant="ghost" size="icon" onClick={handleFavorite} disabled={favoriteTransition} title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
                        <Bookmark className={cn("w-5 h-5", isFavorited && "text-primary fill-primary")} />
                      </Button>
                    </div>
                  </section>

                  {canManage && (
                    <>
                      <Separator className="my-12" />
                      <Card>
                        <CardHeader>
                          <CardTitle>Lock Settings</CardTitle>
                          <CardDescription>Manage access control for this post within the series.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <Label className="text-base">Lock Post by Default</Label>
                              <p className="text-sm text-muted-foreground">If on, this post will be locked until a previous requirement is met.</p>
                            </div>
                            <Switch
                              checked={isLockedByDefault}
                              onCheckedChange={setIsLockedByDefault}
                              aria-label="Lock post by default"
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <Label className="text-base">Exam Unlocks Next Post</Label>
                              <p className="text-sm text-muted-foreground">If on, passing this post's exam will unlock the next one in the series.</p>
                            </div>
                            <Switch
                              checked={requiresExamToUnlock}
                              onCheckedChange={setRequiresExamToUnlock}
                              aria-label="Exam unlocks next post"
                            />
                          </div>
                          <Button onClick={handleLockSettingsChange} disabled={lockSettingsTransition}>
                            {lockSettingsTransition ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Lock Settings'}
                          </Button>
                        </CardContent>
                      </Card>
                    </>
                  )}


                  <ExamSection exam={currentPost.exam} />

                  <SponsoredAdCard />

                  <div className="block md:hidden">
                    <Separator className="my-12" />
                    <aside>
                      <div className="flex flex-col items-start gap-4 mb-4">
                        <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
                          <List className="h-6 w-6 text-primary" />
                          <span>{series.title}</span>
                        </h1>
                        {author && (
                          <div className="flex flex-col items-start gap-3 mt-3 w-full">
                            <div className='flex items-center gap-2'>
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={author.image || ''} alt={author.name || ''} />
                                <AvatarFallback>{author.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{author.name}</span>
                            </div>
                            <Button variant="outline" size="sm">
                              <UserPlus className="mr-2 h-4 w-4" />
                              Follow
                            </Button>
                          </div>
                        )}
                      </div>
                      <SeriesTracker
                        seriesId={series.id}
                        posts={postsInSeries}
                        currentPostId={currentPost.id}
                        passedExamIds={passedExamIds}
                        session={session}
                      />
                    </aside>
                  </div>

                  {currentPost.subtitles && currentPost.subtitles.length > 0 && (
                    <>
                      <Separator className="my-12" />
                      <section id="downloads">
                        <h2 className="font-serif text-3xl font-bold mb-6 flex items-center gap-3">
                          <Download className="w-8 h-8 text-primary" />
                          Downloads
                        </h2>
                        <div className="space-y-4">
                          {currentPost.subtitles.map((subtitle) => (
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
                                {currentUser ? (
                                  <Button variant="ghost" size="icon" asChild>
                                    <a href={subtitle.url} download>
                                      <Download className="h-5 w-5" />
                                    </a>
                                  </Button>
                                ) : (
                                  <span title="Login to download"><Lock className="h-5 w-5 text-muted-foreground" /></span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </>
                  )}


                  <section id="reviews" className="my-12">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="font-serif text-3xl font-bold flex items-center gap-3">
                        <MessageCircle className="w-8 h-8 text-primary" />
                        Responses ({reviews.length})
                      </h2>
                      <Button variant="ghost" size="icon" onClick={() => setShowReviews(!showReviews)}>
                        {showReviews ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                      </Button>
                    </div>
                    {showReviews && (
                      <>
                        <ReviewForm
                          postId={currentPost.id}
                          isSubmitting={isSubmittingReview}
                          onSubmitReview={handleReviewSubmit}
                          session={session}
                        />
                        <Separator className="my-8" />
                        <div className="space-y-8">
                          {isSubmittingReview && !reviews.some(r => r.id > 999999) && (
                            <div className="flex items-start gap-4">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div className="w-full space-y-2">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                              </div>
                            </div>
                          )}
                          {reviews.length > 0 ? (
                            reviews.map((review: Review) => (
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
                              <p className="text-muted-foreground">
                                Be the first to share your thoughts!
                              </p>
                            )
                          )}
                        </div>
                      </>
                    )}
                  </section>
                </>
              )}

            </article>
          </div>
          <aside className="hidden md:block md:col-span-1 md:h-screen">
            <div className="md:sticky md:top-24 overflow-y-auto">
              <div className="flex flex-col items-start gap-4 mb-4">
                <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
                  <List className="h-6 w-6 text-primary" />
                  <span>{series.title}</span>
                </h1>
              </div>
              <SeriesTracker
                seriesId={series.id}
                posts={postsInSeries}
                currentPostId={currentPost.id}
                passedExamIds={passedExamIds}
                session={session}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

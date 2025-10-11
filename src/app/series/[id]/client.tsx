

'use client';

import { notFound, useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Post, Review, Series, User } from '@/lib/types';
import SeriesTracker from '@/components/series-tracker';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, List, UserPlus, MessageCircle, Eye, ThumbsUp, ThumbsDown, Bookmark, Download, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState, useMemo, useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import ReviewCard from '@/components/review-card';
import ReviewForm from '@/components/review-form';
import { useToast } from '@/hooks/use-toast';
import { toggleLikePost, toggleFavoritePost, createReview, deleteReview } from '@/lib/actions';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import SponsoredAdCard from '@/components/sponsored-ad-card';


export default function SeriesPageClient({
    series,
    postsInSeries,
    initialPost
}: {
    series: Series,
    postsInSeries: Post[],
    initialPost: Post
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  
  const [likeTransition, startLikeTransition] = useTransition();
  const [favoriteTransition, startFavoriteTransition] = useTransition();
  const [isSubmittingReview, startReviewTransition] = useTransition();

  const [currentPost, setCurrentPost] = useState(initialPost);
  const [reviews, setReviews] = useState<Review[]>(initialPost.reviews);
  const [showReviews, setShowReviews] = useState(false);
  
  const author = postsInSeries[0]?.author;

  useEffect(() => {
    setCurrentPost(initialPost);
    setReviews(initialPost.reviews);
  }, [initialPost]);

  const heroImage =
    currentPost.posterUrl ||
    PlaceHolderImages.find((p) => p.id === 'movie-poster-placeholder')?.imageUrl;
    
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
        user: currentUser,
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
            if (node.id === optimisticReview.id) return newReview;
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


  const isFavorited = currentUser && currentPost.favoritePosts && currentPost.favoritePosts.some(fav => fav.userId === currentUser?.id);
  const isLiked = currentUser && currentPost.likedBy?.some(user => user.id === currentUser.id);
  const isDisliked = currentUser && currentPost.dislikedBy?.some(user => user.id === currentUser.id);


  return (
    <div className="w-full bg-background text-foreground">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-3">
                <article>
                    <div className="relative h-[400px] w-full rounded-xl overflow-hidden mb-8">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.back()}
                          className="absolute top-4 left-4 z-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-white/20"
                        >
                          <ArrowLeft className="h-5 w-5" />
                          <span className="sr-only">Back</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="absolute top-4 left-16 z-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/20 hover:bg-white/20"
                        >
                          <Link href="/">
                            <Home className="h-5 w-5" />
                            <span className="sr-only">Home</span>
                          </Link>
                        </Button>

                        {heroImage && (
                            <Image
                                src={heroImage}
                                alt={`Poster for ${currentPost.title}`}
                                fill
                                className="object-cover"
                                priority
                            />
                        )}
                         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                    </div>

                    <h2 className="text-4xl font-bold font-serif mb-4">{currentPost.title}</h2>
                    <div
                      className="prose prose-lg prose-invert max-w-none text-foreground/80"
                      dangerouslySetInnerHTML={{ __html: currentPost.description }}
                    />
                    
                    <Separator className="my-12" />

                    <section id="stats" className="flex items-center justify-between text-muted-foreground mb-12">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2" title="Total views">
                                <Eye className="w-5 h-5" />
                                <span className="text-sm font-medium">{currentPost.viewCount.toLocaleString()}</span>
                            </div>
                             <div className="flex items-center gap-2" title="Total likes">
                                <ThumbsUp className="w-5 h-5" />
                                <span className="text-sm font-medium">{currentPost.likedBy?.length || 0}</span>
                            </div>
                              <div className="flex items-center gap-2" title="Total dislikes">
                                <ThumbsDown className="w-5 h-5" />
                                <span className="text-sm font-medium">{currentPost.dislikedBy?.length || 0}</span>
                            </div>
                        </div>

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
                                    <Lock className="h-5 w-5 text-muted-foreground" title="Login to download" />
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

                </article>
            </div>
             <aside className="hidden md:block md:col-span-1 md:h-screen">
                <div className="md:sticky md:top-24 overflow-y-auto">
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
                    />
                </div>
            </aside>
        </div>
      </main>
    </div>
  );
}

    
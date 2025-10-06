
'use client';

import { notFound, useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Post, Review, Series, User } from '@/lib/types';
import SeriesTracker from '@/components/series-tracker';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, List, UserPlus, MessageCircle, Eye, ThumbsUp, ThumbsDown, Bookmark } from 'lucide-react';
import { useEffect, useState, useMemo, useTransition } from 'react';
import Loading from './loading';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import ReviewCard from '@/components/review-card';
import ReviewForm from '@/components/review-form';
import { useToast } from '@/hooks/use-toast';
import { toggleLikePost, toggleFavoritePost } from '@/lib/actions';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';


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

  const currentPost = initialPost;
  const author = postsInSeries[0]?.author;

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

  const isFavorited = currentUser && currentPost.favoritePosts && currentPost.favoritePosts.some(fav => fav.userId === currentUser?.id);
  const isLiked = currentUser && currentPost.likedBy?.some(user => user.id === currentUser.id);
  const isDisliked = currentUser && currentPost.dislikedBy?.some(user => user.id === currentUser.id);


  return (
    <div className="w-full bg-background text-foreground">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Left Sidebar: Series Tracker */}
            <aside className="md:col-span-1 md:order-first md:h-screen">
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

            {/* Right Content: Current Post Details */}
            <div className="md:col-span-3 order-first">
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


                    <section id="reviews" className="my-12">
                      <h2 className="font-serif text-3xl font-bold mb-6 flex items-center gap-3">
                        <MessageCircle className="w-8 h-8 text-primary" />
                        Responses ({currentPost.reviews.length})
                      </h2>
                      <div className="space-y-8">
                        {currentPost.reviews.length > 0 ? (
                          currentPost.reviews.map((review: Review) => (
                            <ReviewCard key={review.id} review={review} postId={currentPost.id} />
                          ))
                        ) : (
                          <p className="text-muted-foreground">
                            Be the first to share your thoughts!
                          </p>
                        )}
                      </div>
                      <Separator className="my-8" />
                      <ReviewForm postId={currentPost.id} />
                    </section>

                </article>
            </div>
        </div>
      </main>
    </div>
  );
}

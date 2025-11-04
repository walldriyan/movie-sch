

'use server';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Film, Star, CalendarDays, Clock, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFavoritePosts } from '@/lib/actions';
import type { Post } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, formatRelative } from 'date-fns';
import ClientRelativeDate from '@/components/client-relative-date';
import DOMPurify from 'isomorphic-dompurify';

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const favoritePosts = await getFavoritePosts();
  const posts = favoritePosts as any[];

  const authorAvatarPlaceholder = PlaceHolderImages.find((img) => img.id === 'avatar-1');
  
  if (posts.length === 0) {
    return (
      <div className="w-full bg-background text-foreground">
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 text-center mt-16">
          <div className="max-w-md">
             <Bookmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-serif text-4xl font-bold">
              No Favorites Yet
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              You haven't added any posts to your favorites. Click the bookmark icon on a post to save it here.
            </p>
             <Button asChild className="mt-8">
                <Link href="/">Browse Posts</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full bg-background text-foreground">
      <TooltipProvider>
        <main className="max-w-4xl mx-auto px-4 py-8">
           <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold">My Favorites</h1>
            <p className="text-muted-foreground mt-2">A collection of content you've saved.</p>
           </div>

          <Separator className="mb-8" />
          
          <div className={`space-y-12 transition-opacity`}>
            {posts.map((post) => {
              const postImageUrl =
                post.posterUrl ||
                PlaceHolderImages.find(
                  (p) => p.id === 'movie-poster-placeholder'
                )?.imageUrl;
              
              const authorAvatarUrl = post.author?.image || authorAvatarPlaceholder?.imageUrl;
              const postDate = new Date(post.updatedAt);
              const sanitizedDescription = DOMPurify.sanitize(post.description);

              return (
                <article key={post.id}>
                  <div className="flex items-center space-x-3 mb-4 text-sm">
                    <Link
                      href={`/profile/${post.author.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar className="w-6 h-6">
                        {authorAvatarUrl && (
                          <AvatarImage
                            src={authorAvatarUrl}
                            alt={post.author.name || 'Author'}
                            data-ai-hint="person face"
                          />
                        )}
                        <AvatarFallback>{post.author.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground group-hover:text-primary">
                        {post.author.name}
                      </span>
                    </Link>

                    <Tooltip>
                      <TooltipTrigger>
                        <ClientRelativeDate date={postDate.toISOString()} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{format(postDate, "MMMM d, yyyy 'at' h:mm a")}</p>
                      </TooltipContent>
                    </Tooltip>

                  </div>

                  <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8">
                      <Link href={`/movies/${post.id}`} className="group block">
                        <h2 className="font-serif text-2xl font-bold leading-snug group-hover:text-primary transition-colors">
                            {post.title}
                        </h2>
                      </Link>
                      <div
                        className="prose prose-sm prose-invert text-muted-foreground mt-2 line-clamp-2 [&_img]:hidden"
                        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                      />
                    </div>
                    <div className="col-span-4">
                      {postImageUrl && (
                        <Link
                          href={`/movies/${post.id}`}
                          className="block aspect-video relative overflow-hidden rounded-md"
                        >
                          <Image
                            src={postImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{post.imdbRating ? post.imdbRating.toFixed(1) : 'N/A'}</span>
                    </div>
                    <span>&middot;</span>
                    <span>{post.duration}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      </TooltipProvider>
    </div>
  );
}

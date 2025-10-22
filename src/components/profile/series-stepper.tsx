
'use client';

import type { Series, Post } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const Step = ({ post, isLast }: { post: Post; isLast: boolean }) => {
  const postImage = post.posterUrl || PlaceHolderImages.find(p => p.id === 'movie-poster-placeholder')?.imageUrl;

  // Create a plain text version of the description
  const plainDescription = post.description?.replace(/<[^>]+>/g, '');

  return (
    <li className="relative flex items-start gap-4 pb-8">
      {!isLast && <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-border" />}
      
      <div className="relative flex h-8 w-8 flex-none items-center justify-center bg-background">
        <div className="h-2 w-2 rounded-full bg-primary ring-1 ring-primary" />
      </div>

      <div className="flex-grow">
        <div className="flex items-start gap-4">
          <Link href={`/movies/${post.id}`} className="block flex-shrink-0 relative w-20 aspect-[2/3] rounded-md overflow-hidden">
            {postImage && (
              <Image
                src={postImage}
                alt={post.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            )}
          </Link>
          <div className="flex-grow">
            <p className="text-xs text-muted-foreground">Part {post.orderInSeries}</p>
            <h4 className="font-semibold text-foreground">
              <Link href={`/movies/${post.id}`} className="hover:text-primary">{post.title}</Link>
            </h4>
            <p
              className="mt-1 text-sm text-muted-foreground line-clamp-2"
            >
              {plainDescription}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
};

export default function SeriesStepper({ series }: { series: Series }) {
  if (!series.posts || series.posts.length === 0) {
    return null;
  }
  
  const displayedPosts = series.posts.slice(0, 3);
  const totalPosts = series._count?.posts ?? series.posts.length;

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold font-serif">{series.title}</h3>
        {totalPosts > 3 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/series/${series.id}`}>
                View All {totalPosts} Posts <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
        )}
      </div>

      <ul>
        {displayedPosts.map((post, index) => (
          <Step
            key={post.id}
            post={post}
            isLast={index === displayedPosts.length - 1}
          />
        ))}
      </ul>
    </section>
  );
}

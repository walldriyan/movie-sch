
'use client';

import { notFound, useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Post, Series } from '@/lib/types';
import SeriesTracker from '@/components/series-tracker';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import Loading from './loading';


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

  // The active post is determined by the initialPost prop.
  // No need for client-side state for the current post itself,
  // as navigation will trigger a re-render of the parent server component.
  const currentPost = initialPost;

  const heroImage =
    currentPost.posterUrl ||
    PlaceHolderImages.find((p) => p.id === 'movie-poster-placeholder')?.imageUrl;

  return (
    <div className="w-full bg-background text-foreground">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Left Sidebar: Series Tracker */}
            <aside className="md:col-span-1 md:order-first md:h-screen">
                <div className="md:sticky md:top-24 overflow-y-auto">
                    <h1 className="text-2xl font-bold font-serif mb-4">{series.title}</h1>
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

                    {/* You can add more details from fullCurrentPost here, like reviews, etc. */}
                </article>
            </div>
        </div>
      </main>
    </div>
  );
}

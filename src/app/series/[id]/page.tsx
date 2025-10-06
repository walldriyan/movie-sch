
'use client';

import { notFound, useRouter } from 'next/navigation';
import { getSeriesById, getPostsBySeriesId, getPost } from '@/lib/actions';
import type { Post } from '@/lib/types';
import SeriesTracker from '@/components/series-tracker';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useEffect, useState } from 'react';

// This is a server component by default, but we need client-side interactions.
// Let's create a client wrapper or convert parts to client components.
// For simplicity, we'll fetch data on the server and pass it to a client component.
// But since the request is to modify this file, let's make it a client component
// that fetches data on mount. This is not ideal for SSR but fulfills the request.

export default function SeriesPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { post?: string };
}) {
  const router = useRouter();
  const [series, setSeries] = useState<any>(null);
  const [postsInSeries, setPostsInSeries] = useState<Post[]>([]);
  const [fullCurrentPost, setFullCurrentPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const seriesId = Number(params.id);
  const currentPostIdFromSearch = searchParams?.post ? Number(searchParams.post) : undefined;


  useEffect(() => {
    async function fetchData() {
      if (isNaN(seriesId)) {
        notFound();
        return;
      }
      
      const seriesData = await getSeriesById(seriesId);
      if (!seriesData) {
        notFound();
        return;
      }
      setSeries(seriesData);

      const postsData = (await getPostsBySeriesId(seriesId)) as Post[];
      if (!postsData || postsData.length === 0) {
        notFound();
        return;
      }
      setPostsInSeries(postsData);
      
      const currentPostId = currentPostIdFromSearch ?? postsData[0].id;
      const currentPostData = (await getPost(currentPostId)) as Post | null;

      if (!currentPostData) {
        notFound();
        return;
      }
      setFullCurrentPost(currentPostData);
      setLoading(false);
    }
    fetchData();
  }, [seriesId, currentPostIdFromSearch]);

  if (loading || !fullCurrentPost) {
    // You might want a more sophisticated loading component here
    return <div>Loading...</div>;
  }
   
  const heroImage =
    fullCurrentPost.posterUrl ||
    PlaceHolderImages.find((p) => p.id === 'movie-poster-placeholder')?.imageUrl;


  return (
    <div className="w-full bg-background text-foreground">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Left Sidebar: Series Tracker */}
            <aside className="md:col-span-1">
                <div className="sticky top-24">
                    <h1 className="text-2xl font-bold font-serif mb-4">{series.title}</h1>
                    <SeriesTracker
                        seriesId={series.id}
                        posts={postsInSeries}
                        currentPostId={fullCurrentPost.id}
                    />
                </div>
            </aside>

            {/* Right Content: Current Post Details */}
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
                                alt={`Poster for ${fullCurrentPost.title}`}
                                fill
                                className="object-cover"
                                priority
                            />
                        )}
                         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                    </div>

                    <h2 className="text-4xl font-bold font-serif mb-4">{fullCurrentPost.title}</h2>
                    <div
                      className="prose prose-lg prose-invert max-w-none text-foreground/80"
                      dangerouslySetInnerHTML={{ __html: fullCurrentPost.description }}
                    />

                    {/* You can add more details from fullCurrentPost here, like reviews, etc. */}
                </article>
            </div>
        </div>
      </main>
    </div>
  );
}


import { notFound } from 'next/navigation';
import { getSeriesById, getPostsBySeriesId, getPost } from '@/lib/actions';
import type { Post } from '@/lib/types';
import SeriesTracker from '@/components/series-tracker';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';

export default async function SeriesPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { post?: string };
}) {
  const seriesId = Number(params.id);
  if (isNaN(seriesId)) {
    notFound();
  }

  const series = await getSeriesById(seriesId);
  if (!series) {
    notFound();
  }

  const postsInSeries = (await getPostsBySeriesId(seriesId)) as Post[];
  if (!postsInSeries || postsInSeries.length === 0) {
    // Or show a message that this series has no posts yet
    notFound();
  }

  const currentPostId = searchParams?.post
    ? Number(searchParams.post)
    : postsInSeries[0].id;
  
  const currentPost = postsInSeries.find(p => p.id === currentPostId) || postsInSeries[0];
  
  // Fetch full post details for the main content area
  const fullCurrentPost = (await getPost(currentPost.id)) as Post | null;
  if (!fullCurrentPost) {
     notFound();
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

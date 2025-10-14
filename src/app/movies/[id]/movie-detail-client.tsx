
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Star,
  MessageCircle,
  ListVideo,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { Tabs } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Post as PostType } from '@/lib/types';
import { cn } from '@/lib/utils';
import MovieInteractionButtons from '@/components/movie/movie-interaction-buttons';

export default function MovieDetailClient({
  post,
  onPostUpdate,
  children,
}: {
  post: PostType;
  onPostUpdate: (updatedPost: PostType) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState('about');

  console.log("Client [/movies/[id]/movie-detail-client.tsx] Session from useSession():", JSON.stringify(session, null, 2));
  console.log("Client [/movies/[id]/movie-detail-client.tsx] Current User Details:", session?.user);
  
  const heroImage = post.posterUrl || PlaceHolderImages.find((img) => img.id === 'movie-poster-placeholder')?.imageUrl;
  const authorAvatarUrl = post.author.image || PlaceHolderImages.find((img) => img.id === 'avatar-1')?.imageUrl;

  const tabButtonStyle = 'flex items-center gap-2 cursor-pointer transition-colors hover:text-foreground pb-3 border-b-2 whitespace-nowrap';
  const activeTabButtonStyle = 'text-primary font-semibold border-primary';
  const inactiveTabButtonStyle = 'border-transparent';

  return (
    <>
      <header className="relative h-[500px] w-full rounded-b-2xl overflow-hidden flex items-end">
        {heroImage && (
          <Image
            src={heroImage}
            alt={`Poster for ${post.title}`}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />

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

        <div className="absolute top-4 right-4 z-10 flex flex-wrap gap-2 justify-end">
          {post.genres.map((genre: string) => (
            <Button key={genre} variant="outline" size="sm" className="rounded-full bg-black/20 backdrop-blur-sm border-white/20 hover:bg-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.432 0l6.568-6.568a2.426 2.426 0 0 0 0-3.432z"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
              {genre}
            </Button>
          ))}
        </div>

        <div className="relative z-10 text-foreground flex flex-col items-start text-left pb-0 w-full overflow-hidden pr-8">
          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight mb-4 text-left">
            {post.title}
          </h1>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2.5">
            <Link href={`/profile/${post.author.id}`} className="flex items-center gap-4 group">
              <Avatar className='w-16 h-16'>
                {authorAvatarUrl && (
                  <AvatarImage
                    src={authorAvatarUrl}
                    alt={post.author.name || 'Author'}
                    data-ai-hint="person face"
                  />
                )}
                <AvatarFallback>{post.author.name?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-foreground group-hover:text-primary">
                  {post.author.name}
                </p>
                <div className="flex items-center gap-2">
                  <span>{post.year}</span>
                  <span>&middot;</span>
                  <span>{post.duration}</span>
                </div>
              </div>
            </Link>
          </div>

          <Separator className="my-4 bg-border/20" />
          <div className="flex items-center justify-between py-2 text-muted-foreground w-full overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-6 flex-shrink-0">
              <button
                onClick={() => setActiveTab('about')}
                className={cn(tabButtonStyle, activeTab === 'about' ? activeTabButtonStyle : inactiveTabButtonStyle)}
              >
                <Image src="/imdb.png" alt="IMDb" width={40} height={20} />
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-foreground">{post.imdbRating?.toFixed(1)}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={cn(tabButtonStyle, activeTab === 'reviews' ? activeTabButtonStyle : inactiveTabButtonStyle)}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-foreground">{post._count?.reviews ?? post.reviews.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('subtitles')}
                className={cn(tabButtonStyle, activeTab === 'subtitles' ? activeTabButtonStyle : inactiveTabButtonStyle)}
              >
                <ListVideo className="w-5 h-5" />
                <span className="text-foreground">Subtitles</span>
              </button>
            </div>
            
            <MovieInteractionButtons post={post} onPostUpdate={onPostUpdate} session={session} sessionStatus={sessionStatus} />

          </div>
        </div>
      </header>

      <Tabs value={activeTab} className="mt-8">
        {children}
      </Tabs>
    </>
  );
}

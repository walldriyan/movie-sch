'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Play, Clock, Calendar, ChevronRight, Home, Lock,
    List, MessageCircle, CheckCircle2,
    Download, AlertCircle, FileText
} from 'lucide-react';
import type { Session } from 'next-auth';
import type { Series } from '@prisma/client';
import { Separator } from '@/components/ui/separator';
import MovieInteractionButtons from '@/components/movie/movie-interaction-buttons';
import ReviewForm from '@/components/review-form';
import ReviewCard from '@/components/review-card';
import DOMPurify from 'isomorphic-dompurify';

interface SeriesWatchPageProps {
    series: Series;
    activePost: any;
    allPosts: any[];
    session: Session | null;
    formattedSubtitles: any[];
}

export default function SeriesWatchPage({
    series,
    activePost,
    allPosts,
    session,
    formattedSubtitles
}: SeriesWatchPageProps) {
    const router = useRouter();

    // Video / Media Logic
    const videoLink = useMemo(() => {
        return activePost.mediaLinks?.find((link: any) => link.type === 'trailer' || link.type === 'video');
    }, [activePost.mediaLinks]);

    const getYouTubeVideoId = (url: string) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
            if (urlObj.hostname.includes('youtube.com')) return urlObj.searchParams.get('v');
            return null;
        } catch { return null; }
    };

    const videoId = videoLink ? getYouTubeVideoId(videoLink.url) : null;
    const sanitizedDescription = DOMPurify.sanitize(activePost.description || '');

    // Scroll active post into view in sidebar on mount
    useEffect(() => {
        const activeElement = document.getElementById(`sidebar-post-${activePost.id}`);
        if (activeElement) {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activePost.id]);

    return (
        <div className="min-h-screen bg-background pt-24 pb-12">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6">

                {/* 1. Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6 pl-1">
                    <Link href="/" className="hover:text-primary transition-colors">
                        <Home className="w-4 h-4" />
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/series" className="hover:text-primary transition-colors">
                        Series
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href={`/series/${series.id}`} className="hover:text-primary transition-colors">
                        {series.title}
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground font-medium truncate max-w-[200px]">
                        {activePost.title}
                    </span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* LEFT COLUMN: Main Custom Content (3 cols) */}
                    <div className="lg:col-span-3">

                        {/* HERO: Video/Image (Cinematic Aspect Ratio 2.35:1) */}
                        <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/5 group">

                            {/* OVERLAY: Top Right (Interactions & Details) */}
                            {/* Floating Glass Container */}
                            <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5">
                                {/* Details: Year, Duration, Genre */}
                                <div className="flex items-center gap-3 text-xs font-medium text-white/90 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 hover:bg-black/30 transition-colors">
                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {activePost.year || 'N/A'}</span>
                                    <span className="w-px h-3 bg-white/20" />
                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {activePost.duration || 'N/A'}</span>

                                    {activePost.genres && activePost.genres.length > 0 && (
                                        <>
                                            <span className="w-px h-3 bg-white/20 hidden md:block" />
                                            <div className="hidden md:flex gap-2">
                                                {activePost.genres.slice(0, 2).map((g: string) => (
                                                    <span key={g}>{g}</span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Like/Dislike/Share Bar */}
                                {/* Wrapped to force white text style */}
                                <div className="bg-black/20 backdrop-blur-md rounded-full border border-white/5 p-1 flex items-center gap-1 text-white hover:bg-black/30 transition-colors [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
                                    <MovieInteractionButtons post={activePost} onPostUpdate={() => { }} session={session} />
                                </div>
                            </div>

                            {/* Content or Locked State */}
                            {activePost.isContentLocked ? (
                                // LOCKED STATE
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-center p-6">
                                    <div className="bg-white/10 p-4 rounded-full mb-4 animate-pulse">
                                        <Lock className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Episode Locked</h3>
                                    <p className="text-white/70 max-w-md">
                                        {activePost.visibility === 'GROUP_ONLY'
                                            ? "Exclusive to group members."
                                            : "Complete previous tasks to unlock."}
                                    </p>
                                    <Image
                                        src={activePost.posterUrl || '/placeholder-poster.jpg'}
                                        alt="Locked"
                                        fill
                                        className="object-cover -z-10 opacity-30"
                                    />
                                </div>
                            ) : videoId ? (
                                // VIDEO PLAY STATE
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={activePost.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                // NO VIDEO / POSTER ONLY STATE
                                <div className="relative w-full h-full">
                                    <Image
                                        src={activePost.posterUrl || '/placeholder-poster.jpg'}
                                        alt={activePost.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                </div>
                            )}

                            {/* Title (Bottom Left) - Only show if NO video or Overlay mode preferred */}
                            {(!videoId || activePost.isContentLocked) && (
                                <div className="absolute bottom-6 left-8 max-w-[60%] pointer-events-none">
                                    <Badge variant="secondary" className="mb-3 bg-white/20 text-white backdrop-blur-md border-0">
                                        Ep {getAllPostsIndex(allPosts, activePost.id)}
                                    </Badge>
                                    <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                                        {activePost.title}
                                    </h1>
                                </div>
                            )}

                            {/* Author Info (Bottom Right) */}
                            {activePost.author && (
                                <div className="absolute bottom-6 right-8 z-20">
                                    <Link href={`/profile/${activePost.author.id}`} className="flex items-center gap-3 bg-black/30 backdrop-blur-md p-1.5 pl-4 pr-1.5 rounded-full border border-white/5 hover:bg-black/50 transition-colors group/author">
                                        <div className="flex flex-col items-end mr-1">
                                            <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Created by</span>
                                            <span className="text-sm font-medium text-white group-hover/author:text-primary transition-colors">
                                                {activePost.author.name}
                                            </span>
                                        </div>
                                        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/20">
                                            <Image
                                                src={activePost.author.image || '/avatar-placeholder.png'}
                                                alt={activePost.author.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* SEPARATOR 1: Post Content */}
                        <div className="my-8 flex items-center gap-4 opacity-50">
                            <Separator className="flex-1" />
                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Description</span>
                            <Separator className="flex-1" />
                        </div>

                        {/* STATIC OVERVIEW / DESCRIPTION */}
                        <div className="space-y-8 min-h-[100px] mb-12">
                            {activePost.isContentLocked ? (
                                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                        <Lock className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Episode Locked</h3>
                                    <p className="text-muted-foreground text-center max-w-sm mb-6">
                                        Join the group or upgrade to Premium to view this episode's details.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                                    />
                                    {activePost.exam && activePost.exam.length > 0 && (
                                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-4">
                                            <div className="p-3 bg-primary/10 rounded-full">
                                                <CheckCircle2 className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg mb-1">Knowledge Check</h3>
                                                <p className="text-muted-foreground mb-4">Complete the exam for this episode.</p>
                                                <Link href={`/exams/${activePost.exam[0].id}`}>
                                                    <Button>Start Exam</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* TABS: Reviews, Subtitles ONLY */}
                        <Tabs defaultValue="reviews" className="w-full">
                            <TabsList className="mb-8 w-full justify-start h-auto p-1 bg-muted/50 rounded-xl">
                                <TabsTrigger value="reviews" className="flex-1 md:flex-none gap-2 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <MessageCircle className="w-4 h-4" /> Reviews ({activePost._count?.reviews || 0})
                                </TabsTrigger>
                                <TabsTrigger value="subtitles" className="flex-1 md:flex-none gap-2 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <List className="w-4 h-4" /> Subtitles
                                </TabsTrigger>
                            </TabsList>

                            {/* Reviews Tab */}
                            <TabsContent value="reviews" className="animate-in fade-in slide-in-from-left-4 duration-300 min-h-[300px]">
                                <div className="max-w-3xl">
                                    <div className="mb-8 p-6 bg-muted/30 rounded-2xl">
                                        <h3 className="text-lg font-semibold mb-4">Leave a comment</h3>
                                        <ReviewForm
                                            postId={activePost.id}
                                            isSubmitting={false}
                                            onSubmitReview={async () => { }}
                                            session={session}
                                        />
                                    </div>
                                    <div className="space-y-6">
                                        {activePost.reviews && activePost.reviews.length > 0 ? (
                                            activePost.reviews.map((review: any) => (
                                                <ReviewCard
                                                    key={review.id}
                                                    review={review}
                                                    session={session}
                                                    onReviewSubmit={async () => { }}
                                                    onReviewDelete={async () => { }}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
                                                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                                <p>No reviews yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="subtitles" className="animate-in fade-in slide-in-from-left-4 duration-300 min-h-[300px]">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {formattedSubtitles && formattedSubtitles.length > 0 ? (
                                        formattedSubtitles.map((sub: any) => (
                                            <div key={sub.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                                                        <FileText className="w-5 h-5 text-foreground group-hover:text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{sub.language}</p>
                                                        <p className="text-xs text-muted-foreground">{sub.uploaderName}</p>
                                                    </div>
                                                </div>
                                                <Button size="icon" variant="ghost" asChild className="rounded-full">
                                                    <a href={sub.url} download>
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center col-span-full py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
                                            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                            <p>No subtitles.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* SEPARATOR 2: Ads */}
                        <div className="my-8 flex items-center gap-4 opacity-50">
                            <Separator className="flex-1" />
                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Sponsored</span>
                            <Separator className="flex-1" />
                        </div>

                        {/* SPONSORED AD SLOT */}
                        <div className="w-full p-8 border border-dashed rounded-2xl bg-muted/20 flex flex-col items-center justify-center text-center">
                            <div className="w-full max-w-[728px] h-[90px] bg-muted/50 rounded flex items-center justify-center">
                                <span className="text-muted-foreground/50 font-medium">Ad Space (728x90)</span>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Sidebar (1 col) - No Changes, kept intact */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-28 space-y-4">
                            <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-5 shadow-sm">
                                <h2 className="font-bold text-lg leading-tight mb-2">{series.title}</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {activePost.description ? (activePost.description.slice(0, 60) + '...') : 'Series overview'}
                                </p>
                                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground bg-muted p-2 rounded-lg">
                                    <span>{allPosts.length} Episodes</span>
                                    <span>Updated {new Date(series.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-250px)]">
                                <div className="p-4 border-b bg-muted/30 font-semibold text-sm flex items-center justify-between">
                                    <span>Episode List</span>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="p-2 space-y-1">
                                        {allPosts.map((post, index) => {
                                            const isActive = post.id === activePost.id;
                                            return (
                                                <button
                                                    key={post.id}
                                                    id={`sidebar-post-${post.id}`}
                                                    onClick={() => router.push(`/series/${series.id}?post=${post.id}`)}
                                                    className={cn(
                                                        "w-full flex gap-3 p-2 rounded-xl text-left transition-all border group",
                                                        isActive
                                                            ? "bg-primary/5 border-primary/20 shadow-sm"
                                                            : "bg-transparent border-transparent hover:bg-muted/50",
                                                        post.isLocked && !isActive && "opacity-60"
                                                    )}
                                                >
                                                    <div className="relative w-28 aspect-video bg-muted rounded-lg overflow-hidden shrink-0 border border-border/50">
                                                        <Image
                                                            src={post.posterUrl || '/placeholder-poster.jpg'}
                                                            alt={post.title}
                                                            fill
                                                            className={cn("object-cover transition-transform duration-500", !isActive && "group-hover:scale-105")}
                                                        />
                                                        {post.isLocked && (
                                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                                <Lock className="w-4 h-4 text-white/90" />
                                                            </div>
                                                        )}
                                                        {isActive && !post.isLocked && (
                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-[10px] text-white font-medium rounded-md backdrop-blur-sm">
                                                            Ep {index + 1}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                                                        <h4 className={cn(
                                                            "text-sm font-semibold leading-tight line-clamp-2 mb-1.5",
                                                            isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                                                        )}>
                                                            {post.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                                                                <Clock className="w-3 h-3" />
                                                                {post.duration || '--'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function getAllPostsIndex(posts: any[], id: number) {
    return posts.findIndex(p => p.id === id) + 1;
}

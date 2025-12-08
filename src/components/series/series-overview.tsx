'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Play, Clock, Calendar, ChevronRight, Home,
    LayoutGrid, List, CheckCircle2, Lock
} from 'lucide-react';
import type { Series } from '@prisma/client';

// Define a local type for Post to avoid import issues, matching what we expect from the server
interface SeriesPost {
    id: number;
    title: string;
    description: string;
    posterUrl: string | null;
    duration: string | null;
    year: number | null;
    createdAt: Date | string;
    isLocked?: boolean;
    orderInSeries?: number | null;
}

interface SeriesOverviewProps {
    series: Series;
    posts: SeriesPost[];
}

export default function SeriesOverview({ series, posts }: SeriesOverviewProps) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Use the first post's poster as the series cover if series doesn't have one (assuming series model might not have posterUrl, but we can use the first episode's)
    // If series model has posterUrl, usage would be better. Let's assume we use the first post's poster for now as a fallback.
    const heroImage = (posts[0] && posts[0].posterUrl) || '/placeholder-poster.jpg';

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Breadcrumbs */}
            <div className="bg-muted/30 border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-primary transition-colors">
                            <Home className="w-4 h-4" />
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/series" className="hover:text-primary transition-colors">
                            Series
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-foreground font-medium truncate max-w-[200px]">
                            {series.title}
                        </span>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN - Hero & Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Rounded Hero Section */}
                        <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                            <Image
                                src={heroImage}
                                alt={series.title}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
                                    {series.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm md:text-base mb-6">
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white border border-white/20">
                                        {posts.length} Episodes
                                    </span>
                                    {posts[0]?.year && (
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            {posts[0].year}
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        size="lg"
                                        className="rounded-full bg-white text-black hover:bg-white/90 font-semibold"
                                        onClick={() => {
                                            if (posts.length > 0) router.push(`/movies/${posts[0].id}`);
                                        }}
                                    >
                                        <Play className="w-4 h-4 mr-2" fill="currentColor" />
                                        Start Watching
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Series Description */}
                        <div className="bg-card rounded-2xl p-6 md:p-8 border shadow-sm">
                            <h2 className="text-2xl font-bold mb-4">About this Series</h2>
                            <p className="text-muted-foreground leading-relaxed text-lg">
                                {series.description || "No description available for this series."}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Episodes List */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Episodes</h2>
                            <div className="flex bg-muted rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all",
                                        viewMode === 'list' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all",
                                        viewMode === 'grid' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                            <div className={cn(
                                "gap-4",
                                viewMode === 'grid' ? "grid grid-cols-2" : "flex flex-col"
                            )}>
                                {posts.map((post, index) => (
                                    <Link
                                        href={`/movies/${post.id}`}
                                        key={post.id}
                                        className="group block"
                                    >
                                        <div className={cn(
                                            "relative rounded-xl overflow-hidden border bg-card hover:border-primary/50 transition-all duration-300",
                                            viewMode === 'list' ? "flex gap-4 p-3 items-center" : "space-y-3 p-3"
                                        )}>
                                            {/* Thumbnail */}
                                            <div className={cn(
                                                "relative shrink-0 overflow-hidden rounded-lg bg-muted",
                                                viewMode === 'list' ? "w-32 aspect-video" : "w-full aspect-video"
                                            )}>
                                                <Image
                                                    src={post.posterUrl || '/placeholder-poster.jpg'}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full">
                                                        <Play className="w-4 h-4 text-white" fill="currentColor" />
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                                                    Ep {index + 1}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-sm md:text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                                    {post.title}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                                                    {post.duration && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {post.duration}
                                                        </span>
                                                    )}
                                                    {/* We can show lock status if needed */}
                                                    {post.isLocked && (
                                                        <span className="flex items-center gap-1 text-amber-500">
                                                            <Lock className="w-3 h-3" />
                                                            Locked
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}

                                {posts.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No episodes available yet.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                </div>
            </div>
        </div>
    );
}

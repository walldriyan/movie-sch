'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    Play, Lock, Check, Clock, ChevronLeft, ChevronRight,
    Star, Calendar, Film, Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post, Series } from '@/lib/types';
import type { Session } from 'next-auth';

interface SeriesDetailClientProps {
    series: Series;
    postsInSeries: (Post & { isLocked?: boolean })[];
    initialPost: Post & { isLocked?: boolean };
    session: Session | null;
    passedExamIds: Set<number>;
}

export default function SeriesDetailClient({
    series,
    postsInSeries,
    initialPost,
    session,
    passedExamIds
}: SeriesDetailClientProps) {
    const router = useRouter();
    const [currentPost, setCurrentPost] = useState(initialPost);
    const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(() => {
        return postsInSeries.findIndex(p => p.id === initialPost.id) || 0;
    });

    const isLocked = useMemo(() => {
        return currentPost.isLocked ?? false;
    }, [currentPost]);

    const handleEpisodeSelect = useCallback((post: Post & { isLocked?: boolean }, index: number) => {
        if (!post.isLocked) {
            setCurrentPost(post);
            setSelectedEpisodeIndex(index);
            router.push(`/series?seriesId=${series.id}&post=${post.id}`, { scroll: false });
        }
    }, [router, series.id]);

    const handlePreviousEpisode = useCallback(() => {
        if (selectedEpisodeIndex > 0) {
            const prevPost = postsInSeries[selectedEpisodeIndex - 1];
            handleEpisodeSelect(prevPost, selectedEpisodeIndex - 1);
        }
    }, [selectedEpisodeIndex, postsInSeries, handleEpisodeSelect]);

    const handleNextEpisode = useCallback(() => {
        if (selectedEpisodeIndex < postsInSeries.length - 1) {
            const nextPost = postsInSeries[selectedEpisodeIndex + 1];
            handleEpisodeSelect(nextPost, selectedEpisodeIndex + 1);
        }
    }, [selectedEpisodeIndex, postsInSeries, handleEpisodeSelect]);

    const posterUrl = currentPost.posterUrl || '/placeholder-poster.jpg';
    const genres = Array.isArray(currentPost.genres) ? currentPost.genres : [];

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section with poster */}
            <div className="relative h-[60vh] min-h-[400px]">
                <Image
                    src={posterUrl}
                    alt={currentPost.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Series Title */}
                        <Link
                            href="/series"
                            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Series
                        </Link>

                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                            {series.title}
                        </h1>
                        <h2 className="text-xl md:text-2xl text-white/80 mb-4">
                            Episode {selectedEpisodeIndex + 1}: {currentPost.title}
                        </h2>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-6">
                            {currentPost.year && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    {currentPost.year}
                                </span>
                            )}
                            {currentPost.duration && (
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    {currentPost.duration}
                                </span>
                            )}
                            {genres.length > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Film className="w-4 h-4" />
                                    {genres.slice(0, 3).join(', ')}
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            {isLocked ? (
                                <Button disabled className="gap-2">
                                    <Lock className="w-4 h-4" />
                                    Locked
                                </Button>
                            ) : (
                                <Link href={`/movies/${currentPost.id}`}>
                                    <Button className="gap-2 bg-white text-black hover:bg-white/90">
                                        <Play className="w-4 h-4" />
                                        Watch Now
                                    </Button>
                                </Link>
                            )}

                            {/* Episode Navigation */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handlePreviousEpisode}
                                    disabled={selectedEpisodeIndex === 0}
                                    className="rounded-full"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleNextEpisode}
                                    disabled={selectedEpisodeIndex === postsInSeries.length - 1}
                                    className="rounded-full"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Episodes List */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <h3 className="text-lg font-semibold mb-4">
                    Episodes ({postsInSeries.length})
                </h3>

                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-4 pb-4">
                        {postsInSeries.map((post, index) => {
                            const isPassed = post.exam && passedExamIds.has(post.exam.id);
                            const isSelected = post.id === currentPost.id;

                            return (
                                <button
                                    key={post.id}
                                    onClick={() => handleEpisodeSelect(post, index)}
                                    disabled={post.isLocked}
                                    className={cn(
                                        "relative flex-shrink-0 w-[200px] rounded-lg overflow-hidden transition-all duration-200",
                                        isSelected && "ring-2 ring-primary",
                                        post.isLocked && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {/* Episode Thumbnail */}
                                    <div className="relative aspect-video">
                                        <Image
                                            src={post.posterUrl || '/placeholder-poster.jpg'}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40" />

                                        {/* Status Icon */}
                                        <div className="absolute top-2 right-2">
                                            {post.isLocked ? (
                                                <Lock className="w-4 h-4 text-white" />
                                            ) : isPassed ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : null}
                                        </div>

                                        {/* Episode Number */}
                                        <div className="absolute bottom-2 left-2 text-white font-medium">
                                            Ep {index + 1}
                                        </div>
                                    </div>

                                    {/* Episode Title */}
                                    <div className="p-2 bg-muted/50">
                                        <p className="text-sm font-medium truncate text-left">
                                            {post.title}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {/* Description */}
                {currentPost.description && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">About this Episode</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                            {Array.isArray(currentPost.description)
                                ? currentPost.description.join('\n')
                                : currentPost.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

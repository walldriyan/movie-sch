'use client';

import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/context/loading-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    Play, Clock, Calendar, ChevronRight, ChevronLeft, Home, Lock,
    List, MessageCircle, CheckCircle2,
    Download, AlertCircle, FileText, Film, Tv, Loader2
} from 'lucide-react';
import { getPosts } from '@/lib/actions/posts/read';
import type { Session } from 'next-auth';
import type { Series } from '@prisma/client';
import { Separator } from '@/components/ui/separator';
import MovieInteractionButtons from '@/components/movie/movie-interaction-buttons';

// Lazy load heavy components to reduce initial bundle
const ReviewForm = dynamic(() => import('@/components/review-form'), {
    loading: () => <div className="animate-pulse h-24 bg-white/5 rounded-lg" />,
    ssr: false
});
const ReviewCard = dynamic(() => import('@/components/review-card'), {
    loading: () => <div className="animate-pulse h-16 bg-white/5 rounded-lg" />,
    ssr: false
});
const AdManager = dynamic(() => import('@/components/common/ad-manager'), { ssr: false });

import type { AdUnit } from '@/lib/actions/ads';
import { createReview, deleteReview } from '@/lib/actions/reviews';
import { incrementViewCount } from '@/lib/actions/posts/view';
import { useToast } from '@/hooks/use-toast';

// Lazy load DOMPurify - it's a heavy library
let DOMPurify: any = null;
const sanitizeHTML = (html: string) => {
    if (typeof window !== 'undefined') {
        if (!DOMPurify) {
            const dompurifyModule = require('isomorphic-dompurify');
            // Handle both default and named exports
            DOMPurify = dompurifyModule.default || dompurifyModule;
        }
        if (DOMPurify && typeof DOMPurify.sanitize === 'function') {
            return DOMPurify.sanitize(html);
        }
        // Fallback: strip HTML tags if DOMPurify fails to load
        return html.replace(/<[^>]*>?/gm, '');
    }
    return html; // On server, return as-is (server component handles sanitization)
};

interface UnifiedWatchPageProps {
    type: 'MOVIE' | 'SERIES';
    post: any;
    session: Session | null;
    formattedSubtitles: any[];
    relatedPosts?: any[];
    series?: Series;
    allPosts?: any[];
    adConfig: AdUnit[];
}

interface SidebarThumbnailProps {
    src?: string | null;
    alt: string;
    className?: string;
    isActive?: boolean;
}

const SidebarThumbnail = ({ src, alt, className, isActive }: SidebarThumbnailProps) => {
    const [error, setError] = useState(false);
    const hasImage = src && !src.includes('placeholder') && !error;

    if (!hasImage) {
        return (
            <div className={cn(
                "w-full h-full flex items-center justify-center transition-all duration-500",
                "bg-gradient-to-br from-white/5 to-transparent", // Very subtle gradient
                !isActive && "group-hover:scale-105" // Maintain scaling effect if desired, or remove
            )}>
                {/* Optional: Very subtle icon or just empty as requested "div ekk vitrak" */}
            </div>
        );
    }

    return (
        <Image
            src={src!}
            alt={alt}
            fill
            className={className}
            onError={() => setError(true)}
            loading="lazy"
        />
    );
};

export default function UnifiedWatchPage({
    type,
    post,
    session,
    formattedSubtitles,
    relatedPosts = [],
    series,
    allPosts = [],
    adConfig
}: UnifiedWatchPageProps) {
    const router = useRouter();
    const { startLoading, stopLoading } = useLoading();
    const { toast } = useToast();
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [imgError, setImgError] = useState(false);

    const isPremium = session?.user && (
        session.user.role === 'SUPER_ADMIN' ||
        session.user.role === 'USER_ADMIN' ||
        (session.user as any).accountType === 'PREMIUM' ||
        (session.user as any).accountType === 'HYBRID'
    );

    // Ref for scrolling active episode into view
    const activeEpisodeRef = useRef<HTMLButtonElement>(null);

    // Stop loading when the post content changes (navigation complete)
    useEffect(() => {
        stopLoading();

        // Increment view count with cleanup
        let isMounted = true;
        const incrementView = async () => {
            try {
                if (isMounted) {
                    await incrementViewCount(post.id);
                }
            } catch (error) {
                // Silently handle - view count is non-critical
            }
        };
        incrementView();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post.id]); // Removed stopLoading to prevent re-runs when context changes

    // --- Helper Logic ---
    const videoLink = useMemo(() => {
        return post.mediaLinks?.find((link: any) => link.type === 'trailer' || link.type === 'video');
    }, [post.mediaLinks]);

    const getYouTubeVideoId = (url: string) => {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
            if (urlObj.hostname.includes('youtube.com')) return urlObj.searchParams.get('v');
            return null;
        } catch { return null; }
    };

    const videoId = videoLink ? getYouTubeVideoId(videoLink.url) : null;
    const sanitizedDescription = useMemo(() => sanitizeHTML(post.description || ''), [post.description]);

    // Scroll active post into view in sidebar on mount (for Series) - using ref
    useEffect(() => {
        if (type === 'SERIES' && activeEpisodeRef.current) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                activeEpisodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }
    }, [type, post.id]);

    const getAllPostsIndex = (posts: any[], id: number) => {
        return posts.findIndex(p => p.id === id) + 1;
    };

    const activeAd = useMemo(() => {
        return adConfig.find(ad => ad.active);
    }, [adConfig]);

    const legacyAdConfig = useMemo(() => ({
        imageUrl: activeAd?.imageUrl || '',
        linkUrl: activeAd?.linkUrl || '',
        enabled: !!activeAd
    }), [activeAd]);

    // --- Pagination State for Related Movies ---
    const [displayRelatedPosts, setDisplayRelatedPosts] = useState<any[]>(relatedPosts);
    const [page, setPage] = useState(2);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Reset pagination when post changes
    useEffect(() => {
        setDisplayRelatedPosts(relatedPosts);
        setPage(2);
        setHasMore(relatedPosts.length >= 10);
    }, [post.id]);

    const loadMoreRelated = async () => {
        if (isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const { posts: newPostsRaw, totalPages } = await getPosts({
                page: page,
                limit: 10,
                filters: { type: post.type || 'MOVIE', sortBy: 'viewCount-desc' }
            });

            // Filter out current post if it appears in results
            const newPosts = newPostsRaw ? newPostsRaw.filter((p: any) => p.id !== post.id) : [];

            if (newPosts.length > 0) {
                setDisplayRelatedPosts(prev => [...prev, ...newPosts]);
                setPage(prev => prev + 1);
            }

            // If we received fewer items than limit, or reached total pages, stop.
            if (!newPostsRaw || newPostsRaw.length < 10 || page >= totalPages) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load more related posts", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleReviewSubmit = async (comment: string, rating: number, parentId?: number) => {
        if (!session) {
            toast({
                title: "Authentication required",
                description: "Please sign in to leave a review.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmittingReview(true);
        try {
            await createReview(post.id, comment, rating, parentId);
            toast({
                title: "Success",
                description: parentId ? "Reply posted successfully." : "Review posted successfully.",
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to post review. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleReviewDelete = async (reviewId: number) => {
        try {
            await deleteReview(reviewId);
            toast({
                title: "Success",
                description: "Review deleted.",
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete review.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-12">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6">

                {/* 1. Breadcrumbs */}
                <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6 pl-1">
                    <Link href="/" className="hover:text-primary transition-colors">
                        <Home className="w-4 h-4" />
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    {type === 'SERIES' && series ? (
                        <>
                            <Link href="/series" className="hover:text-primary transition-colors">
                                Series
                            </Link>
                            <ChevronRight className="w-4 h-4" />
                            <Link href={`/series/${series.id}`} className="hover:text-primary transition-colors">
                                {series.title}
                            </Link>
                        </>
                    ) : (
                        <Link href="/" className="hover:text-primary transition-colors">
                            {post.type === 'OTHER' ? 'Documentation' : 'Movies'}
                        </Link>
                    )}
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground font-medium truncate max-w-[200px]">
                        {post.title}
                    </span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* LEFT COLUMN: Main Content (3 cols) */}
                    <div className="lg:col-span-3">

                        {/* HERO SECTION */}
                        <div className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/5 group">

                            {/* OVERLAY: Top Right (Metadata) */}
                            <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5">
                                <div className="flex items-center gap-3 text-xs font-medium text-white/90 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 hover:bg-black/30 transition-colors">
                                    {post.type !== 'OTHER' ? (
                                        <>
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.year || 'N/A'}</span>
                                            <span className="w-px h-3 bg-white/20" />
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {post.duration || 'N/A'}</span>
                                            {post.genres && post.genres.length > 0 && (
                                                <>
                                                    <span className="w-px h-3 bg-white/20 hidden md:block" />
                                                    <div className="hidden md:flex gap-2">
                                                        {post.genres.slice(0, 2).map((g: string) => (
                                                            <span key={g}>{g}</span>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <span className="flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5" /> Documentation
                                        </span>
                                    )}
                                </div>

                                <div className="bg-black/20 backdrop-blur-md rounded-full border border-white/5 p-1 flex items-center gap-1 text-white hover:bg-black/30 transition-colors [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
                                    <MovieInteractionButtons post={post} onPostUpdate={() => { }} session={session} />
                                </div>
                            </div>

                            {/* MAIN MEDIA CONTENT */}
                            {post.isContentLocked ? (
                                // LOCKED
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-center p-6">
                                    <div className="bg-white/10 p-4 rounded-full mb-4 animate-pulse">
                                        <Lock className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {type === 'SERIES' ? "Episode Locked" : "Content Locked"}
                                    </h3>
                                    <p className="text-white/70 max-w-md">
                                        {post.visibility === 'GROUP_ONLY'
                                            ? "Exclusive to group members."
                                            : "This content is locked."}
                                    </p>
                                    <Image
                                        src={post.posterUrl || '/placeholder-poster.jpg'}
                                        alt="Locked"
                                        fill
                                        className="object-cover -z-10 opacity-30"
                                    />
                                </div>
                            ) : videoId ? (
                                // VIDEO PLAYER
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={post.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                // POSTER ONLY
                                // POSTER OR GRADIENT
                                // POSTER OR GRADIENT
                                <div className={cn("relative w-full h-full",
                                    (!post.posterUrl || post.posterUrl.includes('placeholder') || imgError) && (
                                        post.type === 'OTHER'
                                            ? "bg-gradient-to-br from-slate-900 to-blue-900"
                                            : "bg-gradient-to-br from-neutral-900 via-zinc-900 to-black"
                                    )
                                )}>
                                    {(!post.posterUrl || post.posterUrl.includes('placeholder') || imgError) ? (
                                        <div className="w-full h-full flex items-center justify-center opacity-30">
                                            {post.type === 'OTHER' ? (
                                                <div className="w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full" />
                                            ) : (
                                                <Film className="w-20 h-20 text-white/5" />
                                            )}
                                        </div>
                                    ) : (
                                        <Image
                                            src={post.posterUrl || '/placeholder-poster.jpg'}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                            priority
                                            onError={() => setImgError(true)}
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                </div>
                            )}

                            {/* Title Overlay (Bottom Left) if no video or locked */}
                            {(!videoId || post.isContentLocked) && (
                                <div className="absolute bottom-6 left-8 max-w-[60%] pointer-events-none">
                                    {type === 'SERIES' && allPosts.length > 0 && post.type !== 'OTHER' && (
                                        <Badge variant="secondary" className="mb-3 bg-white/20 text-white backdrop-blur-md border-0">
                                            Ep {getAllPostsIndex(allPosts, post.id)}
                                        </Badge>
                                    )}
                                    <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                                        {post.title}
                                    </h1>
                                </div>
                            )}

                            {/* Author Info (Bottom Right) */}
                            {post.author && (
                                <div className="absolute bottom-6 right-8 z-20">
                                    <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 bg-black/30 backdrop-blur-md p-1.5 pl-4 pr-1.5 rounded-full border border-white/5 hover:bg-black/50 transition-colors group/author">
                                        <div className="flex flex-col items-end mr-1">
                                            <span className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Created by</span>
                                            <span className="text-sm font-medium text-white group-hover/author:text-primary transition-colors">
                                                {post.author.name}
                                            </span>
                                        </div>
                                        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/20">
                                            <Image
                                                src={post.author.image || '/avatar-placeholder.png'}
                                                alt={post.author.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* SEPARATOR: Description */}
                        <div className="my-8 flex items-center gap-4 opacity-50">
                            <Separator className="flex-1" />
                            <span className="text-xs text-muted-foreground uppercase tracking-widest">Description</span>
                            <Separator className="flex-1" />
                        </div>

                        {/* DESCRIPTION CONTENT */}
                        <div className="space-y-8 min-h-[100px] mb-12">
                            {post.isContentLocked ? (
                                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                    {/* 1. Ad Card (Non-Premium Only) */}
                                    {!isPremium && (
                                        <div className="w-full p-6 md:p-8 border border-dashed border-white/10 rounded-3xl bg-muted/10 flex flex-col items-center justify-center text-center group hover:bg-muted/20 transition-colors">
                                            <span className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-widest mb-4">Advertisement</span>
                                            <div className="w-full max-w-[728px] h-[100px] bg-black/20 rounded-xl flex items-center justify-center border border-white/5">
                                                <span className="text-muted-foreground/40 font-medium">Ad Space</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Premium Lock Card */}
                                    <div className="relative overflow-hidden flex flex-col items-center justify-center py-16 px-6 border border-amber-500/20 rounded-3xl bg-black/40 backdrop-blur-md text-center shadow-2xl">
                                        {/* Background Effects */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
                                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 blur-[100px] rounded-full pointer-events-none" />

                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-900/20 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)] group">
                                                <Lock className="w-10 h-10 text-amber-500 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]" />
                                            </div>
                                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                                                {type === 'SERIES' ? 'Episode Locked' : 'Story Locked'}
                                            </h3>
                                            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
                                                To read the full story and access exclusive details, please join our Premium Group.
                                            </p>
                                            <Button size="lg" className="h-12 px-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all transform hover:scale-105">
                                                Join Premium Group
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                                    />
                                    {/* Exam Card - Premium Visual Style */}
                                    {post.exam && session?.user && (
                                        <div className="mt-8 relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl group">
                                            {/* Ambient Glow */}
                                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />

                                            <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                                                {/* Icon Box */}
                                                <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-inner">
                                                    <FileText className="w-7 h-7 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                                </div>

                                                {/* Text Content */}
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-xl font-bold text-white tracking-tight">
                                                            {post.exam.title || 'Knowledge Check'}
                                                        </h3>
                                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
                                                            Exam
                                                        </Badge>
                                                    </div>
                                                    <p className="text-white/60 text-sm leading-relaxed max-w-2xl">
                                                        {post.exam.description || `Test your understanding of ${type === 'MOVIE' ? 'this movie' : 'this episode'} and earn points.`}
                                                    </p>
                                                </div>

                                                {/* Action Button */}
                                                <div className="shrink-0 w-full md:w-auto mt-2 md:mt-0">
                                                    <Link href={`/search?examId=${post.exam.id}`} className="block">
                                                        <Button size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                                                            Start Assessment
                                                            <ChevronRight className="w-4 h-4 ml-2" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* SERIES NAVIGATION BUTTONS */}
                        {type === 'SERIES' && allPosts.length > 0 && (
                            <div className="flex items-center justify-between gap-4 mb-10">
                                {/* PREVIOUS BUTTON */}
                                {(() => {
                                    const currentIndex = allPosts.findIndex(p => p.id === post.id);
                                    const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

                                    if (!prevPost) return <div className="flex-1" />; // Spacer

                                    return (
                                        <Button
                                            variant="outline"
                                            className="h-12 rounded-xl border-white/10 bg-black/20 hover:bg-white/5 justify-start pl-4 gap-3 group max-w-[48%]"
                                            onClick={() => {
                                                startLoading();
                                                router.push(`/search?seriesId=${series?.id}&post=${prevPost.id}`);
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <ChevronLeft className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col items-start truncate text-left overflow-hidden">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Previous</span>
                                                <span className="text-xs font-semibold truncate w-full">
                                                    {prevPost.title}
                                                </span>
                                            </div>
                                        </Button>
                                    );
                                })()}

                                {/* NEXT BUTTON */}
                                {(() => {
                                    const currentIndex = allPosts.findIndex(p => p.id === post.id);
                                    const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

                                    if (!nextPost) return <div className="flex-1" />; // Spacer

                                    return (
                                        <Button
                                            variant="outline"
                                            className="h-12 rounded-xl border-white/10 bg-black/20 hover:bg-white/5 justify-end pr-4 gap-3 group max-w-[48%]"
                                            onClick={() => {
                                                startLoading();
                                                router.push(`/search?seriesId=${series?.id}&post=${nextPost.id}`);
                                            }}
                                        >
                                            <div className="flex flex-col items-end truncate text-right overflow-hidden">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Next</span>
                                                <span className="text-xs font-semibold truncate w-full">
                                                    {nextPost.title}
                                                </span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </Button>
                                    );
                                })()}
                            </div>
                        )}

                        {/* TABS: Reviews & Subtitles */}
                        <Tabs defaultValue="reviews" className="w-full">
                            <TabsList className="mb-8 w-full justify-start h-auto p-1 bg-muted/50 rounded-xl">
                                <TabsTrigger value="reviews" className="flex-1 md:flex-none gap-2 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <MessageCircle className="w-4 h-4" /> Reviews ({post._count?.reviews || 0})
                                </TabsTrigger>
                                <TabsTrigger value="subtitles" className="flex-1 md:flex-none gap-2 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <List className="w-4 h-4" /> Subtitles
                                </TabsTrigger>
                            </TabsList>

                            {/* Reviews */}
                            <TabsContent value="reviews" className="animate-in fade-in slide-in-from-left-4 duration-300 min-h-[300px]">
                                <div className="flex flex-col gap-8">
                                    {/* Reviews Main Content - Full Width */}
                                    <div className="w-full">
                                        <div className="mb-8 p-6 bg-muted/30 rounded-2xl">
                                            <h3 className="text-lg font-semibold mb-4">Leave a comment</h3>
                                            <ReviewForm
                                                postId={post.id}
                                                isSubmitting={isSubmittingReview}
                                                onSubmitReview={handleReviewSubmit}
                                                session={session}
                                            />
                                        </div>
                                        <div className="space-y-6">
                                            {post.reviews && post.reviews.length > 0 ? (
                                                post.reviews.map((review: any) => (
                                                    <ReviewCard
                                                        key={review.id}
                                                        review={review}
                                                        session={session}
                                                        onReviewSubmit={handleReviewSubmit}
                                                        onReviewDelete={handleReviewDelete}
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

                                    {/* AD SIDEBAR (Stacked below reviews now) */}
                                    {!isPremium && (
                                        <div className="w-full">
                                            <AdManager initialConfig={legacyAdConfig} userRole={session?.user?.role} />
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Subtitles */}
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

                        {/* Ad Space */}
                        {!isPremium && (
                            <>
                                <div className="my-8 flex items-center gap-4 opacity-50">
                                    <Separator className="flex-1" />
                                    <span className="text-xs text-muted-foreground uppercase tracking-widest">Sponsored</span>
                                    <Separator className="flex-1" />
                                </div>
                                <div className="w-full p-8 border border-dashed rounded-2xl bg-muted/20 flex flex-col items-center justify-center text-center">
                                    <div className="w-full max-w-[728px] h-[90px] bg-muted/50 rounded flex items-center justify-center">
                                        <span className="text-muted-foreground/50 font-medium">Ad Space (728x90)</span>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>

                    {/* RIGHT SIDEBAR COLUMN */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 z-10 flex flex-col gap-4 h-[calc(100vh-6rem)]">

                            {/* Sidebar Header */}
                            <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-5 shadow-sm shrink-0">
                                {type === 'SERIES' && series ? (
                                    <>
                                        <h2 className="font-bold text-lg leading-tight mb-2">{series.title}</h2>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {post.description ? (post.description.slice(0, 60) + '...') : 'Series overview'}
                                        </p>
                                        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground bg-muted p-2 rounded-lg">
                                            <span>{allPosts.length} Episodes</span>
                                            <span>Updated {new Date(series.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="font-bold text-lg leading-tight mb-2">Recommended</h2>
                                        <p className="text-sm text-muted-foreground">
                                            More movies you might like
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Sidebar List (Episodes or Related Movies) */}
                            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col shrink-0">
                                {type === 'SERIES' && (
                                    <div className="p-4 border-b bg-muted/30 font-semibold text-sm flex items-center justify-between">
                                        <span>{post.type === 'OTHER' ? 'Articles' : 'Episode List'}</span>
                                        <span className="text-xs text-muted-foreground">{allPosts.length} {post.type === 'OTHER' ? 'Arts' : 'Eps'}</span>
                                    </div>
                                )}

                                {/* MOVIE INFO CARD (IMDB Style) */}
                                {type === 'MOVIE' && post.type !== 'OTHER' && (
                                    <div className="p-5 border-b space-y-4 bg-gradient-to-b from-card to-muted/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="font-bold text-lg">Movie Info</h2>
                                            <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded text-xs font-bold border border-yellow-500/20">
                                                <span className="text-sm">★</span> {post.rating || '8.5'}/10
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                            <div className="col-span-2 space-y-1">
                                                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Genres</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {post.genres && post.genres.length > 0 ? post.genres.map((g: string) => (
                                                        <Badge key={g} variant="secondary" className="text-[10px] px-1.5 h-5 bg-muted border-white/10">{g}</Badge>
                                                    )) : <span className="text-muted-foreground">-</span>}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Year</p>
                                                <p className="font-medium">{post.year || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Duration</p>
                                                <p className="font-medium">{post.duration || 'N/A'}</p>
                                            </div>

                                            <div className="col-span-2 space-y-1">
                                                <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Director</p>
                                                <p className="font-medium text-primary">{post.author?.name || 'Unknown'}</p>
                                            </div>
                                        </div>

                                        {post.description && (
                                            <div className="pt-2 border-t border-dashed border-white/10 mt-2">
                                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 italic">
                                                    "{post.description.replace(/<[^>]*>?/gm, '')}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="p-3 bg-muted/10 font-medium text-xs text-muted-foreground uppercase tracking-wider border-b">
                                    {type === 'SERIES' ? 'Up Next' : 'More Like This'}
                                </div>

                                <ScrollArea className="flex-1">
                                    <div className="p-2 space-y-1">
                                        {type === 'SERIES' ? (
                                            // SERIES EPISODE LIST
                                            allPosts.map((episode, index) => {
                                                const isActive = episode.id === post.id;
                                                return (
                                                    <button
                                                        key={episode.id}
                                                        ref={isActive ? activeEpisodeRef : null}
                                                        onClick={() => {
                                                            if (episode.id !== post.id) startLoading();
                                                            router.push(`/search?seriesId=${series?.id}&post=${episode.id}`, { scroll: false });
                                                        }}
                                                        className={cn(
                                                            "w-full flex gap-3 p-2 rounded-xl text-left transition-all border group",
                                                            isActive
                                                                ? "bg-primary/10 border-primary/20 shadow-sm"
                                                                : "bg-transparent border-transparent hover:bg-muted/50",
                                                            episode.isLocked && !isActive && "opacity-60"
                                                        )}
                                                    >
                                                        <div className="relative w-24 aspect-video bg-muted rounded-lg overflow-hidden shrink-0 border border-border/50 shadow-sm">
                                                            <SidebarThumbnail
                                                                src={episode.posterUrl}
                                                                alt={episode.title}
                                                                className={cn("object-cover transition-transform duration-500", !isActive && "group-hover:scale-105")}
                                                                isActive={isActive}
                                                            />
                                                            {episode.isLocked && (
                                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                                    <Lock className="w-3 h-3 text-white/90" />
                                                                </div>
                                                            )}
                                                            {isActive && !episode.isLocked && (
                                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
                                                                </div>
                                                            )}
                                                            {post.type !== 'OTHER' && (
                                                                <div className="absolute bottom-0.5 right-0.5 px-1 py-px bg-black/80 text-[8px] text-white font-medium rounded-sm backdrop-blur-sm">
                                                                    Ep {index + 1}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                                                            <h4 className={cn(
                                                                "text-xs font-semibold leading-tight line-clamp-2 mb-1",
                                                                isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                                                            )}>
                                                                {episode.title}
                                                            </h4>
                                                            {post.type !== 'OTHER' && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                        <Clock className="w-2.5 h-2.5" />
                                                                        {episode.duration || '--'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            // RELATED MOVIES LIST
                                            <>
                                                {displayRelatedPosts.map((rPost) => {
                                                    const isActive = rPost.id === post.id;
                                                    return (
                                                        <button
                                                            key={rPost.id}
                                                            onClick={() => router.push(`/search?movieId=${rPost.id}`)}
                                                            className={cn(
                                                                "w-full flex gap-3 p-2 rounded-xl text-left transition-all border group",
                                                                isActive
                                                                    ? "bg-primary/10 border-primary/20 shadow-sm"
                                                                    : "bg-transparent border-transparent hover:bg-muted/50"
                                                            )}
                                                        >
                                                            <div className="relative w-24 aspect-video bg-muted rounded-lg overflow-hidden shrink-0 border border-border/50 shadow-sm">
                                                                <SidebarThumbnail
                                                                    src={rPost.posterUrl}
                                                                    alt={rPost.title}
                                                                    className={cn("object-cover transition-transform duration-500", !isActive && "group-hover:scale-105")}
                                                                    isActive={isActive}
                                                                />
                                                                <div className="absolute bottom-0.5 right-0.5 px-1 py-px bg-black/80 text-[8px] text-white font-medium rounded-sm backdrop-blur-sm">
                                                                    Movie
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                                                                <h4 className={cn(
                                                                    "text-xs font-semibold leading-tight line-clamp-2 mb-1",
                                                                    isActive ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"
                                                                )}>
                                                                    {rPost.title}
                                                                </h4>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                        <Clock className="w-2.5 h-2.5" />
                                                                        {rPost.duration || '--'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                })}

                                                {hasMore && (
                                                    <div className="pt-2 pb-4 flex justify-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={loadMoreRelated}
                                                            disabled={isLoadingMore}
                                                            className="text-xs text-muted-foreground hover:text-primary w-full"
                                                        >
                                                            {isLoadingMore ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                                            {isLoadingMore ? 'Loading...' : 'Load More Movies'}
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {type === 'MOVIE' && displayRelatedPosts.length === 0 && (
                                            <div className="p-4 text-center text-muted-foreground text-sm">
                                                No related movies found.
                                            </div>
                                        )}
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


'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Film, Globe, Tv, Users, ChevronRight, ListFilter, Clapperboard, Folder, Lock, Sparkles, TrendingUp, ArrowRight, RotateCcw, Camera, Loader2, Crown, Megaphone } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User, Post, GroupWithCount, SerializedGroupWithCount } from '@/lib/types';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
// import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'; // Removed pagination
import { getPosts } from '@/lib/actions/posts/read';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { uploadHeroImage } from '@/lib/actions/upload-hero';
import { useTransition } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Session } from 'next-auth';
import { Skeleton } from './ui/skeleton';
import { ROLES } from '@/lib/permissions';
import { siteConfig } from '@/config/site.config';
import { PromoData } from '@/lib/actions/promo';

// Lazy load heavy components
const GroupCard = dynamic(() => import('./group-card'), {
    loading: () => <Skeleton className="h-64 rounded-3xl" />
});
const PostGrid = dynamic(() => import('./post-grid'), {
    loading: () => <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-[2/3] rounded-xl" />)}</div>
});
const AdvancedAudioPlayer = dynamic(() => import('@/components/media/advanced-audio-player').then(mod => ({ default: mod.AdvancedAudioPlayer })), {
    ssr: false,
    loading: () => <div className="h-10 w-40 bg-white/5 rounded-full animate-pulse" />
});

// ========================================
// HERO SECTION - Suno.com Style with Rounded Banner
// ========================================
const HeroSection = ({ user, initialHeroCoverUrl }: { user?: any; initialHeroCoverUrl?: string | null }) => {
    const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1920&q=80";
    const [imgSrc, setImgSrc] = useState(initialHeroCoverUrl || DEFAULT_FALLBACK);
    const [isUploading, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageVersion, setImageVersion] = useState(Date.now());

    const isPrivileged = user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        startTransition(async () => {
            const res = await uploadHeroImage(formData);
            if (res.success && res.imageUrl) {
                // Update to new Supabase URL
                setImageVersion(Date.now());
                setImgSrc(`${res.imageUrl}?v=${Date.now()}`);
            }
        });
    };

    return (
        <section className="relative pt-24 md:pt-32 pb-8">
            {/* Suno-style Hero Banner - compact height */}
            <div className="relative mx-4 md:mx-6 rounded-3xl overflow-hidden h-[400px] shadow-2xl border border-white/5 group/hero">
                {/* Background Image - music studio style */}
                <Image
                    key={imageVersion}
                    src={imgSrc}
                    alt="Hero Background"
                    fill
                    className="object-cover transition-opacity duration-500"
                    priority
                    onError={() => {
                        // Fallback to default if Supabase image fails
                        setImgSrc(DEFAULT_FALLBACK);
                    }}
                />

                {/* Edit Button for Admins */}
                {isPrivileged && (
                    <div className="absolute top-4 right-16 z-30 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 gap-2"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            {isUploading ? 'Updating...' : 'Change Cover'}
                        </Button>
                    </div>
                )}

                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

                {/* Content overlay */}
                <div className="absolute inset-0 z-10 p-8 md:p-12 flex flex-col justify-center pointer-events-none">
                    <div className="max-w-xl pointer-events-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-pink-500 text-white text-xs font-semibold w-fit mb-5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>NEW PRODUCT</span>
                        </div>

                        {/* Headline - bigger and bolder */}
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6 drop-shadow-lg">
                            {siteConfig.hero.headline}
                        </h1>

                        {/* Description */}
                        <p className="text-white/80 text-sm md:text-base mb-8 leading-relaxed max-w-md drop-shadow-md">
                            {siteConfig.hero.description}
                        </p>

                        {/* CTA Buttons - like Suno */}
                        <div className="flex items-center gap-3 mb-8">
                            <Button
                                size="default"
                                className="bg-white/[0.1] hover:bg-white/[0.2] text-white font-semibold h-10 px-6 text-sm rounded-full backdrop-blur-md border border-white/10"
                                asChild
                            >
                                <Link href={siteConfig.hero.cta.primary.href}>
                                    {siteConfig.hero.cta.primary.text}
                                </Link>
                            </Button>
                            <Button
                                size="default"
                                variant="ghost"
                                className="text-white hover:bg-white/10 font-semibold h-10 px-6 text-sm rounded-full"
                                asChild
                            >
                                <Link href={siteConfig.hero.cta.secondary.href}>
                                    Learn More
                                </Link>
                            </Button>
                        </div>

                        {/* ADVANCED AUDIO PLAYER - Integrated here */}
                        <AdvancedAudioPlayer className="mt-4" canEdit={isPrivileged} />
                    </div>
                </div>

                {/* User Profile - Absolute Bottom Center - Magnified & Clickable */}
                {user && (
                    <Link href={`/profile/${user.id}`} className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 z-20 animate-in fade-in slide-in-from-bottom-4 duration-700 group cursor-pointer">
                        {/* Same profile code */}
                        <div className="relative">
                            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-black/50 shadow-2xl transition-transform duration-300 group-hover:scale-105 group-hover:border-primary/50 text-3xl font-bold bg-[#1a1a1a]">
                                {user.image && <AvatarImage src={user.image} alt={user.name || 'User'} className="object-cover" />}
                                <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary to-purple-600 text-white">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>

                            {/* Home Hero Badge */}
                            {(() => {
                                let label = 'FREE';
                                if (user.role === 'SUPER_ADMIN') label = 'ADMIN';
                                else if (user.subscription?.planName) {
                                    label = user.subscription.planName;
                                    if (label.toLowerCase().includes('pro') || label.toLowerCase().includes('premium')) label = 'PRO';
                                } else if (user.isPro) label = 'PRO'; // Fallback

                                return (
                                    <>
                                        <div className="absolute top-1/2 -right-3 md:-right-4 transform translate-x-1/2 -translate-y-1/2 hidden md:block z-30">
                                            <div className="px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white text-xs font-bold tracking-widest uppercase shadow-2xl whitespace-nowrap">
                                                {label}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </Link>
                )}
            </div>
        </section>
    );
};

// ========================================
// FOOTER COMPONENT
// ========================================
const Footer = () => {
    return (
        <footer className="relative mt-24 pb-12">
            <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">

                {/* Brand Logo & Name */}
                <div className="flex items-center justify-center gap-3 mb-6 mt-12">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                        <Film className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-bold text-3xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">{siteConfig.name}</span>
                </div>

                {/* Description */}
                <p className="text-muted-foreground max-w-lg mb-8 text-sm leading-relaxed">
                    {siteConfig.footer.description}
                </p>

                {/* Navigation Links - Centered Row */}
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                    {(siteConfig.footer.columns as unknown as any[]).flatMap(col => col.links).map((link: any, i: number) => (
                        <Link key={i} href={link.href} className="text-sm font-medium text-white/60 hover:text-primary transition-colors">
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-4 mb-10">
                    <SocialLink href={siteConfig.social.twitter} icon="twitter" />
                    <SocialLink href={siteConfig.social.instagram} icon="instagram" />
                    <SocialLink href={siteConfig.social.youtube} icon="youtube" />
                    <SocialLink href={siteConfig.social.discord} icon="discord" />
                </div>

                {/* Bottom Bar */}
                <Separator className="w-full max-w-xs bg-white/5 mb-8" />
                <div className="flex flex-col sm:flex-row items-center gap-6 text-xs text-muted-foreground/60">
                    <p>{siteConfig.footer.copyright}</p>
                    <div className="flex items-center gap-4">
                        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                        <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Social Link Helper Component
const SocialLink = ({ href, icon }: { href: string; icon: string }) => {
    const iconClass = "w-5 h-5 text-muted-foreground hover:text-primary transition-colors";
    return (
        <Link href={href} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            {icon === 'twitter' && (
                <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            )}
            {icon === 'instagram' && (
                <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
            )}
            {icon === 'youtube' && (
                <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
            )}
            {icon === 'discord' && (
                <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
            )}
        </Link>
    );
};


// ========================================
// MAIN COMPONENT
// ========================================
interface HomePageClientProps {
    initialPosts: any[];
    initialUsers: User[];
    initialGroups: SerializedGroupWithCount[];
    totalPages: number;
    currentPage: number;
    searchParams?: { timeFilter?: string, page?: string, sortBy?: string, type?: string, lockStatus?: string };
    session: Session | null;

    promoData: PromoData;
    initialAds?: any[];
    heroCoverUrl?: string | null;
}

export default function HomePageClient({
    initialPosts,
    initialUsers,
    initialGroups,
    totalPages,
    currentPage,
    searchParams,
    session,
    promoData,
    initialAds = [],
    heroCoverUrl,
}: HomePageClientProps) {

    // Remove artificial loading delay - data comes from server
    // Use loading state only for client-side transitions if needed
    const [loading] = useState(false);

    // Helper to dedupe posts based on ID
    const dedupePosts = (posts: any[]) => {
        const uniqueIds = new Set();
        return posts.filter(post => {
            if (!post.id) return true; // Keep posts without ID just in case, or filter them out
            if (uniqueIds.has(post.id)) return false;
            uniqueIds.add(post.id);
            return true;
        });
    };

    // State for Infinite Scroll - initialize with deduped posts
    const [visiblePosts, setVisiblePosts] = useState(() => dedupePosts(initialPosts));
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(totalPages > 1);
    const [page, setPage] = useState(2); // Start from page 2 since page 1 is initialPosts

    // Reset state when filters/initial data change
    // Use primitive values from searchParams instead of the object itself to prevent infinite loops
    const searchParamsKey = `${searchParams?.timeFilter}-${searchParams?.sortBy}-${searchParams?.type}-${searchParams?.lockStatus}`;

    useEffect(() => {
        setVisiblePosts(dedupePosts(initialPosts));
        setHasMore(totalPages > 1);
        setPage(2);
    }, [initialPosts, totalPages, searchParamsKey]); // Use primitive key instead of object reference

    const users = initialUsers;
    const groups = initialGroups;
    const timeFilter = searchParams?.timeFilter;
    const sortBy = searchParams?.sortBy;
    const typeFilter = searchParams?.type;
    const lockStatus = searchParams?.lockStatus;

    const handleLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);

        try {
            // Fetch next page with limit 10 as requested
            const { posts: newPosts, totalPages: newTotalPages } = await getPosts({
                page: page,
                limit: 10,
                filters: {
                    timeFilter: searchParams?.timeFilter,
                    sortBy: searchParams?.sortBy,
                    type: searchParams?.type,
                    lockStatus: searchParams?.lockStatus
                }
            });

            if (newPosts && newPosts.length > 0) {
                setVisiblePosts(prev => {
                    // Combine and dedupe
                    const combined = [...prev, ...newPosts];
                    return dedupePosts(combined);
                });

                setPage(prev => prev + 1);

                if (page >= newTotalPages) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load more posts", error);
        } finally {
            setLoadingMore(false);
        }
    };

    // Memoize placeholder lookup
    const userAvatarPlaceholder = useMemo(() =>
        PlaceHolderImages.find((img) => img.id === 'avatar-4'),
        []);

    // Memoize query string builder
    const buildQueryString = useCallback((params: Record<string, string | number | undefined | null>) => {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value) {
                searchParams.set(key, String(value));
            }
        }
        const queryString = searchParams.toString();
        return queryString ? `?${queryString}` : '/';
    }, []);

    const typeFilters = [
        { label: 'Movies', value: 'MOVIE', icon: <Clapperboard className="w-4 h-4" /> },
        { label: 'TV Series', value: 'TV_SERIES', icon: <Tv className="w-4 h-4" /> },
        { label: 'Other', value: 'OTHER', icon: <Folder className="w-4 h-4" /> },
    ]

    const isPrivilegedUser = session?.user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role);

    // Memoize mixed posts with ads - MUST be at top level, not inside conditional JSX
    const mixedPostsWithAds = useMemo(() => {
        if (typeFilter === 'sponsored') return visiblePosts; // Don't mix if already viewing ads

        const activeAds = initialAds || [];
        const mixed: any[] = [];
        let adIndex = 0;

        // Put newest ad first in the grid
        if (activeAds.length > 0) {
            mixed.push(activeAds[0]);
            adIndex = 1;
        }

        visiblePosts.forEach((post, i) => {
            mixed.push(post);

            // Pattern: Every 5 Posts, insert an ad
            if ((i + 1) % 5 === 0) {
                // Slot 1: Sponsored Ad (or Place Ad if no more ads)
                if (activeAds.length > adIndex) {
                    mixed.push(activeAds[adIndex]);
                    adIndex++;
                } else if (activeAds.length > 0) {
                    // Cycle through ads again
                    mixed.push(activeAds[adIndex % activeAds.length]);
                    adIndex++;
                } else {
                    mixed.push({ isPlaceAdPlaceholder: true });
                }

                // Slot 2: Always "Create Your Ad" Card
                mixed.push({ isPlaceAdPlaceholder: true });
            }
        });
        return mixed;
    }, [visiblePosts, initialAds, typeFilter]);


    return (
        <TooltipProvider>
            <div className="w-full bg-background text-foreground">
                {/* Hero Section */}
                <HeroSection user={session?.user} initialHeroCoverUrl={heroCoverUrl} />

                {/* Main Content Area - Aligned with Hero */}
                <section className="w-full max-w-[1800px] mx-auto px-4 md:px-8 pb-12 relative z-10 space-y-16">

                    {/* SECTION 1: Featured & Filters */}
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            {/* Title */}
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                                    <TrendingUp className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">{siteConfig.sections.featured.title}</h2>
                                    <p className="text-muted-foreground">{siteConfig.sections.featured.subtitle}</p>
                                </div>
                            </div>
                        </div>

                        {/* Filter Section - Aligned Full Width */}
                        <div className="mb-10 rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 p-4 md:p-6 backdrop-blur-md">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                {/* Filter Tabs - Premium Style */}
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 w-full pb-1 sm:pb-0">
                                    <Button asChild variant={'ghost'} size="sm" className={cn(
                                        "rounded-xl px-4 h-10 transition-all text-sm font-medium border",
                                        !typeFilter && !lockStatus
                                            ? 'bg-primary/20 text-primary border-primary/20 shadow-[0_0_15px_rgba(236,72,153,0.2)]'
                                            : 'bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white'
                                    )}>
                                        <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: undefined, lockStatus: undefined })} scroll={false} className="flex items-center gap-2">
                                            <Globe className="w-4 h-4" />
                                            <span>All</span>
                                        </Link>
                                    </Button>

                                    {typeFilters.map(filter => (
                                        <Button key={filter.value} asChild variant={'ghost'} size="sm" className={cn(
                                            "rounded-xl px-4 h-10 transition-all text-sm font-medium border",
                                            typeFilter === filter.value && !lockStatus
                                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                                : 'bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:text-white'
                                        )}>
                                            <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: filter.value, lockStatus: undefined })} scroll={false} className="flex items-center gap-2">
                                                {filter.icon}
                                                <span>{filter.label}</span>
                                            </Link>
                                        </Button>
                                    ))}

                                    <div className="w-px h-6 bg-white/10 mx-2" />

                                    <Button asChild variant={'ghost'} size="sm" className={cn(
                                        "rounded-xl px-4 h-10 transition-all text-sm font-medium border",
                                        lockStatus === 'locked'
                                            ? 'bg-red-500/20 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                            : 'bg-white/5 text-muted-foreground border-white/5 hover:text-red-400 hover:bg-red-500/10'
                                    )}>
                                        <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: undefined, lockStatus: 'locked' })} scroll={false} className="flex items-center gap-2">
                                            <Lock className="w-3.5 h-3.5" />
                                            <span>Locked</span>
                                        </Link>
                                    </Button>

                                    <Button asChild variant={'ghost'} size="sm" className={cn(
                                        "rounded-xl px-4 h-10 transition-all text-sm font-medium border",
                                        lockStatus === 'premium'
                                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                            : 'bg-white/5 text-muted-foreground border-white/5 hover:text-amber-400 hover:bg-amber-500/10'
                                    )}>
                                        <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: undefined, lockStatus: 'premium' })} scroll={false} className="flex items-center gap-2">
                                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Premium</span>
                                        </Link>
                                    </Button>

                                    <Button asChild variant={'ghost'} size="sm" className={cn(
                                        "rounded-xl px-4 h-10 transition-all text-sm font-medium border",
                                        typeFilter === 'sponsored'
                                            ? 'bg-purple-500/20 text-purple-400 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                            : 'bg-white/5 text-muted-foreground border-white/5 hover:text-purple-400 hover:bg-purple-500/10'
                                    )}>
                                        <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: 'sponsored', lockStatus: undefined })} scroll={false} className="flex items-center gap-2">
                                            <Megaphone className="w-3.5 h-3.5" />
                                            <span>Sponsored Ads</span>
                                        </Link>
                                    </Button>

                                    {/* Reset Filter Button (Visible if filters active) */}
                                    {(typeFilter || lockStatus || timeFilter !== 'all' || sortBy !== 'updatedAt-desc') && (
                                        <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 hover:text-white text-muted-foreground transition-colors ml-auto md:ml-2" title="Reset Filters">
                                            <Link href="/">
                                                <RotateCcw className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>

                                {/* Sort Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="rounded-full bg-black/20 border-white/10 text-white/90 hover:bg-white/10 hover:text-white px-4 h-9 min-w-[100px] justify-between">
                                            <span className="flex items-center gap-2">
                                                <ListFilter className="w-4 h-4 text-muted-foreground" />
                                                Sort
                                            </span>
                                            <ChevronRight className="w-3 h-3 opacity-50 rotate-90" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 bg-[#111112] border-white/10 text-white" align="end">
                                        <DropdownMenuLabel>Sort Content</DropdownMenuLabel>
                                        <DropdownMenuSeparator className="bg-white/10" />
                                        <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'updatedAt-desc', type: typeFilter, lockStatus })} scroll={false}><DropdownMenuRadioItem value="newest" className="focus:bg-white/10 focus:text-white">Newest First</DropdownMenuRadioItem></Link>
                                        <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'updatedAt-asc', type: typeFilter, lockStatus })} scroll={false}><DropdownMenuRadioItem value="oldest" className="focus:bg-white/10 focus:text-white">Oldest First</DropdownMenuRadioItem></Link>
                                        <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'imdbRating-desc', type: typeFilter, lockStatus })} scroll={false}><DropdownMenuRadioItem value="imdb" className="focus:bg-white/10 focus:text-white">Top Rated</DropdownMenuRadioItem></Link>

                                        <DropdownMenuSeparator className="bg-white/10" />
                                        <DropdownMenuLabel>Time Period</DropdownMenuLabel>
                                        <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'today', type: typeFilter, lockStatus })} scroll={false}><DropdownMenuRadioItem value="today" className="focus:bg-white/10 focus:text-white">Today</DropdownMenuRadioItem></Link>
                                        <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'this_week', type: typeFilter, lockStatus })} scroll={false}><DropdownMenuRadioItem value="week" className="focus:bg-white/10 focus:text-white">This Week</DropdownMenuRadioItem></Link>
                                        <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'all', type: typeFilter, lockStatus })} scroll={false}><DropdownMenuRadioItem value="all" className="focus:bg-white/10 focus:text-white">All Time</DropdownMenuRadioItem></Link>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Posts Grid */}
                        {visiblePosts.length === 0 && !loading ? (
                            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                                    <Clapperboard className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <h1 className="text-2xl font-bold mb-2">No Content Found</h1>
                                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">No posts match the current filters. Try changing the category or sorting.</p>
                                <Button asChild variant="secondary" className="rounded-full">
                                    <Link href="/">Clear Filters</Link>
                                </Button>
                            </div>
                        ) : (
                            <>

                                {/* Mix Ads into Posts */}
                                <PostGrid posts={mixedPostsWithAds} />

                                {/* Load More Button */}
                                {hasMore && (
                                    <div className="mt-12 flex justify-center py-8">
                                        <Button
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                            variant="secondary"
                                            className="min-w-[200px] rounded-full h-12 text-base font-medium bg-secondary/50 hover:bg-secondary border border-white/5 transition-all"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    Loading...
                                                </>
                                            ) : (
                                                <>
                                                    Load More Movies
                                                    <ChevronRight className="w-4 h-4 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>



                    {/* SECTION 2: Creators */}
                    <div className="relative rounded-[3px] bg-slate-800/[0.01] border border-blue-500/[0.05] p-6 md:p-12 backdrop-blur-sm overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-500/[0.02] rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3.5 rounded-2xl bg-blue-500/[0.05] border border-blue-500/[0.08] shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                        <Users className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{siteConfig.sections.creators.title}</h2>
                                        <p className="text-muted-foreground mt-1 text-sm md:text-base">{siteConfig.sections.creators.subtitle}</p>
                                    </div>
                                </div>
                                <Button variant="outline" className="rounded-full border-blue-500/20 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors" asChild>
                                    <Link href="/search?view=creators">View All <ArrowRight className="w-4 h-4 ml-2" /></Link>
                                </Button>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="flex flex-col items-center">
                                            <Skeleton className="w-28 h-28 rounded-full" />
                                            <Skeleton className="h-4 w-24 mt-4" />
                                        </div>
                                    ))}
                                </div>
                            ) : users.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
                                    {users.map(user => {
                                        const userAvatarUrl = user.image || userAvatarPlaceholder?.imageUrl;
                                        return (
                                            <Link href={`/profile/${user.id}`} key={user.id} className="group flex flex-col items-center p-4 rounded-3xl hover:bg-blue-500/[0.08] transition-all duration-300 border border-transparent hover:border-blue-500/10">
                                                <div className="relative mb-5 transform group-hover:-translate-y-1 transition-transform duration-300">
                                                    <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-white/[0.03] group-hover:border-blue-500/30 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] transition-all duration-300 shadow-xl">
                                                        {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={user.name || 'User'} className="object-cover" />}
                                                        <AvatarFallback className="text-3xl bg-[#1a1a1a]">{user.name?.charAt(0) || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    {user.role !== 'USER' && (
                                                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-600 to-blue-400 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full border-4 border-[#0F0F10] shadow-lg">
                                                            PRO
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-lg text-center truncate w-full group-hover:text-blue-400 transition-colors">{user.name}</h3>
                                                <p className="text-xs font-medium text-white/40 group-hover:text-white/60 transition-colors mt-1">{user.role === 'USER' ? 'Member' : 'Creator'}</p>
                                            </Link>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-blue-500/[0.02] rounded-3xl border border-dashed border-blue-500/10">
                                    <div className="text-blue-500/40 text-sm font-medium">No creators available right now.</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 3: Collections */}
                    <div className="relative rounded-[3px] bg-gray-900/2 border border-gray-900/2 p-6 md:p-12 backdrop-blur-sm overflow-hidden">
                        {/* Decorative background element */}
                        <div className="absolute top-0 left-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-gray-500/[0.02] rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 -translate-x-1/3 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3.5 rounded-2xl bg-gray-900/1 border border-red-300/7 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                                        <Folder className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{siteConfig.sections.collections.title}</h2>
                                        <p className="text-muted-foreground mt-1 text-sm md:text-base">{siteConfig.sections.collections.subtitle}</p>
                                    </div>
                                </div>
                                <Button variant="outline" className="rounded-full border-purple-500/20 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-colors" asChild>
                                    <Link href="/groups">View All <ArrowRight className="w-4 h-4 ml-2" /></Link>
                                </Button>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
                                </div>
                            ) : groups.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groups.map((group) => (
                                        <div key={group.id} className="transform hover:scale-[1.02] transition-transform duration-300">
                                            <GroupCard group={group} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-purple-500/[0.02] rounded-3xl border border-dashed border-purple-500/10">
                                    <div className="text-purple-500/40 text-sm font-medium">No collections available right now.</div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <Footer />
            </div >
        </TooltipProvider >
    );
}



'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Film, Globe, Tv, Users, ChevronRight, ListFilter, Calendar, Clock, Star, Clapperboard, Folder, Lock, Sparkles, TrendingUp, BookOpen, Compass, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User, Post, GroupWithCount } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import GroupCard from './group-card';
import type { Session } from 'next-auth';
import { Skeleton } from './ui/skeleton';
import PostGrid from './post-grid';
import { ROLES } from '@/lib/permissions';
import { siteConfig } from '@/config/site.config';

// ========================================
// 3D FLOATING CARD COMPONENT
// ========================================
interface FloatingCardProps {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    delay?: number;
    position: 'left' | 'center' | 'right';
    zIndex?: number;
}

const FloatingCard = ({ title, subtitle, imageUrl, delay = 0, position, zIndex = 10 }: FloatingCardProps) => {
    const positionStyles = {
        left: 'left-0 -translate-x-1/4 rotate-y-[25deg] rotate-z-[-3deg]',
        center: 'left-1/2 -translate-x-1/2 rotate-y-[0deg]',
        right: 'right-0 translate-x-1/4 rotate-y-[-25deg] rotate-z-[3deg]',
    };

    return (
        <div
            className={cn(
                "absolute w-56 h-72 rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 hover:scale-105",
                "bg-gradient-to-br from-stone-800/90 via-stone-900/95 to-neutral-900/90",
                "border border-stone-700/50 backdrop-blur-xl",
                "animate-float cursor-pointer group"
            )}
            style={{
                animationDelay: `${delay}ms`,
                zIndex,
                transform: `perspective(1000px) ${position === 'left' ? 'rotateY(15deg) rotateZ(-2deg) translateX(-20%)' : position === 'right' ? 'rotateY(-15deg) rotateZ(2deg) translateX(20%)' : 'rotateY(0)'}`,
            }}
        >
            {/* Card Image */}
            {imageUrl && (
                <div className="relative h-40 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-transparent to-transparent z-10" />
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                </div>
            )}
            {/* Card Content */}
            <div className="p-4 space-y-2">
                <h3 className="font-bold text-white/95 text-base line-clamp-2">{title}</h3>
                {subtitle && (
                    <p className="text-xs text-stone-400 line-clamp-2">{subtitle}</p>
                )}
            </div>
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
    );
};

// ========================================
// HERO SECTION - Suno.com Style with Rounded Banner
// ========================================
const HeroSection = () => {
    return (
        <section className="relative pt-16 pb-8">
            {/* Suno-style Hero Banner - compact height */}
            <div className="relative mx-3 rounded-xl overflow-hidden h-[350px]">
                {/* Background Image - music studio style */}
                <Image
                    src="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1920&q=80"
                    alt="Hero Background"
                    fill
                    className="object-cover"
                    priority
                />

                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

                {/* Content overlay */}
                <div className="absolute inset-0 z-10 p-8 md:p-12 flex flex-col justify-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-pink-500 text-white text-xs font-semibold w-fit mb-5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>NEW PRODUCT</span>
                    </div>

                    {/* Headline - bigger and bolder */}
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-lg leading-[1.15] mb-4">
                        {siteConfig.hero.headline}
                    </h1>

                    {/* Description */}
                    <p className="text-white/80 text-sm md:text-base max-w-md mb-6 leading-relaxed">
                        {siteConfig.hero.description}
                    </p>

                    {/* CTA Buttons - like Suno */}
                    <div className="flex items-center gap-3">
                        <Button
                            size="default"
                            className="bg-white/[0.03] hover:bg-white/[0.06] text-white/70 hover:text-white font-semibold h-10 px-5 text-sm rounded-full border-0"
                            asChild
                        >
                            <Link href={siteConfig.hero.cta.primary.href}>
                                {siteConfig.hero.cta.primary.text}
                            </Link>
                        </Button>
                        <Button
                            size="default"
                            variant="ghost"
                            className="text-white hover:bg-white/10 font-semibold h-10 px-5 text-sm"
                            asChild
                        >
                            <Link href={siteConfig.hero.cta.secondary.href}>
                                Learn More
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Scroll up indicator */}
                <button className="absolute top-4 right-4 w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                    <span className="text-sm">^</span>
                </button>
            </div>
        </section>
    );
};

// ========================================
// FOOTER COMPONENT
// ========================================
const Footer = () => {
    return (
        <footer className="bg-background border-t border-border mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    {/* Brand Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Film className="w-6 h-6 text-primary" />
                            </div>
                            <span className="font-bold text-xl">{siteConfig.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            {siteConfig.footer.description}
                        </p>
                        {/* Social Links */}
                        <div className="flex items-center gap-3 pt-2">
                            <SocialLink href={siteConfig.social.twitter} icon="twitter" />
                            <SocialLink href={siteConfig.social.instagram} icon="instagram" />
                            <SocialLink href={siteConfig.social.youtube} icon="youtube" />
                            <SocialLink href={siteConfig.social.discord} icon="discord" />
                        </div>
                    </div>

                    {/* Footer Columns */}
                    {siteConfig.footer.columns.map((column, index) => (
                        <div key={index}>
                            <h3 className="font-semibold text-white mb-4">{column.title}</h3>
                            <ul className="space-y-3">
                                {column.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <Separator className="my-8 bg-white/5" />
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>{siteConfig.footer.copyright}</p>
                    <div className="flex items-center gap-6">
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
    initialGroups: (GroupWithCount & { posts: { posterUrl: string | null }[] })[];
    totalPages: number;
    currentPage: number;
    searchParams?: { timeFilter?: string, page?: string, sortBy?: string, type?: string, lockStatus?: string };
    session: Session | null;
}

export default function HomePageClient({
    initialPosts,
    initialUsers,
    initialGroups,
    totalPages,
    currentPage,
    searchParams,
    session,
}: HomePageClientProps) {

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const posts = initialPosts;
    const users = initialUsers;
    const groups = initialGroups;
    const timeFilter = searchParams?.timeFilter;
    const sortBy = searchParams?.sortBy;
    const typeFilter = searchParams?.type;
    const lockStatus = searchParams?.lockStatus;

    const userAvatarPlaceholder = PlaceHolderImages.find(
        (img) => img.id === 'avatar-4'
    );

    const buildQueryString = (params: Record<string, string | number | undefined | null>) => {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value) {
                searchParams.set(key, String(value));
            }
        }
        const queryString = searchParams.toString();
        return queryString ? `?${queryString}` : '/';
    }

    const typeFilters = [
        { label: 'Movies', value: 'MOVIE', icon: <Clapperboard className="w-4 h-4" /> },
        { label: 'TV Series', value: 'TV_SERIES', icon: <Tv className="w-4 h-4" /> },
        { label: 'Other', value: 'OTHER', icon: <Folder className="w-4 h-4" /> },
    ]

    const isPrivilegedUser = session?.user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(session.user.role);


    return (
        <TooltipProvider>
            <div className="w-full bg-background text-foreground">
                {/* Hero Section */}
                <HeroSection />

                <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">

                    {/* Section Header - Featured/Trending */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <TrendingUp className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-bold">{siteConfig.sections.featured.title}</h2>
                        </div>
                        <p className="text-muted-foreground ml-12">{siteConfig.sections.featured.subtitle}</p>
                    </div>


                    {/* Filter Section - Suno.com Style Banner */}
                    <div className="mb-8 mx-3 rounded-xl overflow-hidden bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm border border-white/5 p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            {/* Filter Tabs */}
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
                                <Button asChild variant={'ghost'} size="sm" className={cn(
                                    "rounded-full hover:bg-white/10 flex-shrink-0 transition-all",
                                    !typeFilter && !lockStatus ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                                )}>
                                    <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: undefined, lockStatus: undefined })} scroll={false} className="flex items-center gap-2">
                                        <Film className="w-4 h-4" />
                                        <span>All</span>
                                    </Link>
                                </Button>
                                {typeFilters.map(filter => (
                                    <Button key={filter.value} asChild variant={'ghost'} size="sm" className={cn(
                                        "rounded-full hover:bg-white/10 flex-shrink-0 transition-all",
                                        typeFilter === filter.value && !lockStatus ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                                    )}>
                                        <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: filter.value, lockStatus: undefined })} scroll={false} className="flex items-center gap-2">
                                            {filter.icon}
                                            <span>{filter.label}</span>
                                        </Link>
                                    </Button>
                                ))}
                                <Button asChild variant={'ghost'} size="sm" className={cn(
                                    "rounded-full hover:bg-white/10 flex-shrink-0 transition-all",
                                    lockStatus === 'locked' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                                )}>
                                    <Link href={buildQueryString({ sortBy, timeFilter, page: 1, type: undefined, lockStatus: 'locked' })} scroll={false} className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        <span>Locked</span>
                                    </Link>
                                </Button>
                            </div>

                            {/* Sort Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex-shrink-0 text-white/90">
                                        <ListFilter className="mr-2 h-4 w-4" />
                                        Sort
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end">
                                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'updatedAt-desc', type: typeFilter, lockStatus })} scroll={false}>
                                        <DropdownMenuRadioItem value="newest">
                                            <Clock className="mr-2 h-4 w-4" /> Newest
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'updatedAt-asc', type: typeFilter, lockStatus })} scroll={false}>
                                        <DropdownMenuRadioItem value="oldest">
                                            <Clock className="mr-2 h-4 w-4" /> Oldest
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href={buildQueryString({ timeFilter, page: 1, sortBy: 'imdbRating-desc', type: typeFilter, lockStatus })} scroll={false}>
                                        <DropdownMenuRadioItem value="imdb">
                                            <Star className="mr-2 h-4 w-4" /> IMDb Rating
                                        </DropdownMenuRadioItem>
                                    </Link>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Filter by date</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'today', type: typeFilter, lockStatus })} scroll={false}>
                                        <DropdownMenuRadioItem value="today">
                                            <Calendar className="mr-2 h-4 w-4" /> Today
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'this_week', type: typeFilter, lockStatus })} scroll={false}>
                                        <DropdownMenuRadioItem value="this_week">
                                            <Calendar className="mr-2 h-4 w-4" /> This Week
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'this_month', type: typeFilter, lockStatus })} scroll={false}>
                                        <DropdownMenuRadioItem value="this_month">
                                            <Calendar className="mr-2 h-4 w-4" /> This Month
                                        </DropdownMenuRadioItem>
                                    </Link>
                                    <Link href={buildQueryString({ sortBy, page: 1, timeFilter: 'all', type: typeFilter, lockStatus })} scroll={false}>
                                        <DropdownMenuRadioItem value="all">
                                            <Calendar className="mr-2 h-4 w-4" /> All Time
                                        </DropdownMenuRadioItem>
                                    </Link>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Posts Grid */}
                    {posts.length === 0 && !loading ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/30 flex items-center justify-center">
                                <Film className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <h1 className="text-2xl font-bold mb-2">No Content Found</h1>
                            <p className="text-muted-foreground mb-6">No posts match the current filters. Try adjusting your search.</p>
                            <Button asChild>
                                <Link href="/">Clear Filters</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <PostGrid posts={posts} />

                            {totalPages > 1 && (
                                <Pagination className="mt-12">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href={buildQueryString({ sortBy, timeFilter, page: currentPage - 1, type: typeFilter, lockStatus })}
                                                scroll={false}
                                                className={cn(
                                                    "bg-white/5 hover:bg-white/10 border-white/10",
                                                    currentPage <= 1 && "pointer-events-none opacity-50"
                                                )}
                                            >
                                            </PaginationPrevious>
                                        </PaginationItem>

                                        <PaginationItem>
                                            <span className="px-4 py-2 rounded-md text-sm font-medium">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                        </PaginationItem>

                                        <PaginationItem>
                                            <PaginationNext
                                                href={buildQueryString({ sortBy, timeFilter, page: currentPage + 1, type: typeFilter, lockStatus })}
                                                scroll={false}
                                                className={cn(
                                                    "bg-white/5 hover:bg-white/10 border-white/10",
                                                    currentPage >= totalPages && "pointer-events-none opacity-50"
                                                )}
                                            >
                                            </PaginationNext>
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}


                            <Separator className="my-12 bg-white/5" />

                            {/* Creators Section */}
                            <section className="mb-12">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                            <Users className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">{siteConfig.sections.creators.title}</h2>
                                            <p className="text-muted-foreground text-sm">{siteConfig.sections.creators.subtitle}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" className="text-muted-foreground hover:text-primary" asChild>
                                        <Link href="/explore">
                                            View All <ChevronRight className="w-4 h-4 ml-1" />
                                        </Link>
                                    </Button>
                                </div>

                                {loading ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-8 gap-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="flex flex-col items-center">
                                                <Skeleton className="w-24 h-24 rounded-full" />
                                                <Skeleton className="h-4 w-20 mt-2" />
                                                <Skeleton className="h-3 w-16 mt-1" />
                                            </div>
                                        ))}
                                    </div>
                                ) : users.length > 0 ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 justify-center gap-x-8 gap-y-6">
                                        {users.map(user => {
                                            const userAvatarUrl = user.image || userAvatarPlaceholder?.imageUrl;
                                            return (
                                                <Link href={`/profile/${user.id}`} key={user.id} className="flex flex-col items-center group">
                                                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24 text-3xl border-2 border-transparent group-hover:border-primary transition-all group-hover:scale-105">
                                                        {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={user.name || 'User'} />}
                                                        <AvatarFallback className="text-xl font-semibold bg-gradient-to-br from-primary/20 to-primary/5">
                                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className='text-center mt-3'>
                                                        <h3 className="font-semibold group-hover:text-primary transition-colors">{user.name}</h3>
                                                        <p className="text-xs text-muted-foreground">{user.role === 'USER' ? 'Creator' : user.role.replace('_', ' ')}</p>
                                                    </div>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold">No Creators Yet</h3>
                                        <p className="text-muted-foreground mt-2 text-sm">Be the first to join our community!</p>
                                    </div>
                                )}
                            </section>

                            <Separator className="my-12 bg-white/5" />

                            {/* Collections/Groups Section */}
                            <section>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-500/10">
                                            <Globe className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">{siteConfig.sections.collections.title}</h2>
                                            <p className="text-muted-foreground text-sm">{siteConfig.sections.collections.subtitle}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" className="text-muted-foreground hover:text-primary" asChild>
                                        <Link href="/groups">
                                            View All <ChevronRight className="w-4 h-4 ml-1" />
                                        </Link>
                                    </Button>
                                </div>
                                {loading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
                                    </div>
                                ) : groups.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                        {groups.map((group) => (
                                            <GroupCard key={group.id} group={group} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                        <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold">No Collections Yet</h3>
                                        <p className="text-muted-foreground mt-2 text-sm">Collections will appear here when available.</p>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </main>

                {/* Footer */}
                <Footer />
            </div>
        </TooltipProvider>
    );
}

'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Search, Users, Rss, ChevronRight, Lock, Globe,
    Sparkles, UserPlus, ArrowRight, Filter, Grid, List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Session } from 'next-auth';

// Default cover images for groups
const DEFAULT_COVER_IMAGES = [
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80',
    'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
];

const getDefaultCover = (index: number) => {
    return DEFAULT_COVER_IMAGES[index % DEFAULT_COVER_IMAGES.length];
};

// ========================================
// GROUP CARD COMPONENT
// ========================================
function GroupCard({ group, index }: { group: any; index: number }) {
    const coverImage = group.coverPhoto || group.posts?.[0]?.posterUrl || getDefaultCover(index);
    const profileImage = group.profilePhoto;
    const [imgError, setImgError] = useState(false);
    const [imgSrc, setImgSrc] = useState(coverImage);

    return (
        <Link href={`/groups/${group.id}`} className="group block">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] transition-all duration-300 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02]">
                {/* Cover Image */}
                <div className="relative w-full h-[140px] overflow-hidden">
                    <Image
                        src={imgSrc}
                        alt={group.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={() => {
                            if (!imgError) {
                                setImgError(true);
                                setImgSrc(getDefaultCover(index));
                            }
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Visibility Badge */}
                    <div className="absolute top-3 right-3">
                        <span className={cn(
                            "px-2.5 py-1 rounded-full backdrop-blur-md text-[11px] font-medium flex items-center gap-1.5",
                            group.visibility === 'PUBLIC'
                                ? "bg-green-500/20 text-green-400"
                                : "bg-amber-500/20 text-amber-400"
                        )}>
                            {group.visibility === 'PUBLIC' ? (
                                <><Globe className="w-3 h-3" /> Public</>
                            ) : (
                                <><Lock className="w-3 h-3" /> Private</>
                            )}
                        </span>
                    </div>

                    {/* Profile Avatar - positioned at bottom of cover */}
                    <div className="absolute -bottom-6 left-4">
                        <Avatar className="h-14 w-14 border-4 border-background">
                            {profileImage ? (
                                <AvatarImage src={profileImage} alt={group.name} />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg font-bold">
                                {group.name?.charAt(0).toUpperCase() || 'G'}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 pt-10">
                    {/* Group Name */}
                    <h3 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                        {group.name}
                    </h3>

                    {/* Description */}
                    {group.description && (
                        <p className="text-sm text-white/50 line-clamp-2 mt-1.5 min-h-[40px]">
                            {group.description}
                        </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                        <div className="flex items-center gap-1.5 text-white/60">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{group._count?.members || 0} members</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/60">
                            <Rss className="w-4 h-4" />
                            <span className="text-sm">{group.posts?.length || 0} posts</span>
                        </div>
                    </div>

                    {/* Join Button */}
                    <div className="mt-4">
                        <Button
                            variant="ghost"
                            className="w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            View Group
                            <ChevronRight className="w-4 h-4 ml-auto" />
                        </Button>
                    </div>
                </div>
            </div>
        </Link>
    );
}

// ========================================
// HERO SECTION
// ========================================
function HeroSection({ onSearch, searchQuery }: { onSearch: (query: string) => void; searchQuery: string }) {
    const [localQuery, setLocalQuery] = useState(searchQuery);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(localQuery);
    };

    return (
        <section className="relative py-16 px-6 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-background to-pink-900/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />

            <div className="relative max-w-4xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
                    <Sparkles className="w-4 h-4" />
                    Discover Communities
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Join Groups & Communities
                </h1>

                {/* Description */}
                <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
                    Connect with like-minded people, access exclusive content, and participate in discussions about your favorite movies and series.
                </p>

                {/* Search Bar */}
                <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                    <Input
                        type="text"
                        placeholder="Search groups..."
                        value={localQuery}
                        onChange={(e) => {
                            setLocalQuery(e.target.value);
                            onSearch(e.target.value);
                        }}
                        className="w-full h-14 pl-12 pr-4 bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:bg-white/15 text-lg"
                    />
                </form>
            </div>
        </section>
    );
}

// ========================================
// MAIN GROUPS PAGE CLIENT
// ========================================
interface GroupsPageClientProps {
    groups: any[];
    session: Session | null;
}

export default function GroupsPageClient({ groups, session }: GroupsPageClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filter groups based on search
    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return groups;
        const query = searchQuery.toLowerCase();
        return groups.filter(group =>
            group.name?.toLowerCase().includes(query) ||
            group.description?.toLowerCase().includes(query)
        );
    }, [groups, searchQuery]);

    return (
        <div className="min-h-screen bg-background pt-[80px]">
            {/* Hero Section */}
            <HeroSection onSearch={setSearchQuery} searchQuery={searchQuery} />

            {/* Groups Section */}
            <section className="px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {searchQuery ? `Results for "${searchQuery}"` : 'All Groups'}
                            </h2>
                            <p className="text-white/50 text-sm mt-1">
                                {filteredGroups.length} groups found
                            </p>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "rounded-lg",
                                    viewMode === 'grid' ? "bg-white/10 text-white" : "text-white/50"
                                )}
                            >
                                <Grid className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "rounded-lg",
                                    viewMode === 'list' ? "bg-white/10 text-white" : "text-white/50"
                                )}
                            >
                                <List className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Groups Grid/List */}
                    {filteredGroups.length > 0 ? (
                        <div className={cn(
                            "gap-6",
                            viewMode === 'grid'
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                : "flex flex-col"
                        )}>
                            {filteredGroups.map((group, index) => (
                                <GroupCard key={group.id} group={group} index={index} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                            <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
                            <h3 className="text-white/60 font-medium text-lg">No groups found</h3>
                            <p className="text-white/40 text-sm mt-2">
                                {searchQuery ? 'Try a different search term' : 'No groups available yet'}
                            </p>
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    className="mt-6"
                                    onClick={() => setSearchQuery('')}
                                >
                                    Clear search
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

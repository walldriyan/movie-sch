'use client';

import { MoreHorizontal, Grid3x3, Bookmark, BookCheck, Clapperboard, Camera, Megaphone, Sparkles, MapPin, Globe, Calendar, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import type { User } from '@prisma/client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EditProfileDialog from '@/components/edit-profile-dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ProfileStats {
  postsCount: number;
  favoritesCount: number;
  followersCount: number;
  followingCount: number;
}

export default function ProfileHeader({ user, currentFilter, isOwnProfile, stats, adId, planLabel }: { user: User, currentFilter: string, isOwnProfile: boolean, stats: ProfileStats, adId?: string, planLabel?: string | null }) {
  // Use user's cover image or a default soft gradient image to key into the 'vibe' of the reference
  const coverImage = user.coverImage || 'https://images.unsplash.com/photo-1620641788421-7f1c918e7e1f?q=80&w=2832&auto=format&fit=crop';

  const userAvatar =
    user.image ||
    PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  const tabs = [
    { id: 'posts', label: 'Overview', icon: Grid3x3 }, // Changed label to Overview to match vibe
    { id: 'series', label: 'Series', icon: Clapperboard },
    { id: 'favorites', label: 'Favorites', icon: Bookmark },
    { id: 'exams', label: 'Exams', icon: BookCheck },
  ];

  if (isOwnProfile) {
    tabs.push({ id: 'ads', label: 'My Ads', icon: Megaphone });
    tabs.push({ id: 'payments', label: 'Payments', icon: Sparkles });
  }

  // Dynamic Tab for Ad View
  if (currentFilter === 'ad_view') {
    tabs.push({ id: 'ad_view', label: 'Sponsored Ads', icon: Megaphone });
  }

  // Handle username formatting
  const username = user.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'user';

  return (
    <div className="pt-24 w-[90%] mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* 1. BANNER & HEADER CONTAINER */}
      <div className="relative rounded-sm overflow-hidden bg-[#111112] border border-white/[0.02] shadow-sm h-[380px] flex flex-col">

        {/* Banner with Gradient Overlay */}
        {/* Banner with Gradient Overlay */}
        <div className="relative h-[140px] shrink-0 w-full group/banner bg-gradient-to-r from-violet-200/20 to-pink-200/20">
          <Image
            src={coverImage}
            alt="Cover"
            fill
            className="object-cover opacity-90 transition-transform duration-700 hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#111112]/60" />

          {/* Edit Cover Trigger */}
          {isOwnProfile && (
            <div className="absolute top-4 right-4 z-30 opacity-0 group-hover/banner:opacity-100 transition-opacity duration-300">
              <EditProfileDialog
                user={user}
                triggerButton={
                  <Button size="sm" className="h-7 bg-black/40 hover:bg-black/60 text-white backdrop-blur-xl border border-white/10 gap-2 rounded-full font-medium text-xs">
                    <Camera className="w-3 h-3" />
                    Edit Cover
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {/* PROFILE INFO SECTION */}
        <div className="flex-1 bg-[#111112] relative flex flex-col w-full min-h-0">

          {/* Avatar - Negative Margin to pull up */}
          <div className="flex justify-center -mt-14 mb-1 z-10 shrink-0">
            <div className="relative p-1 rounded-full bg-[#111112]">
              <Avatar className="w-24 h-24 border-[4px] border-[#111112] shadow-sm">
                {userAvatar && (
                  <AvatarImage src={userAvatar} alt={user.name || 'User'} className="object-cover" />
                )}
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Online Status */}
              <div className="absolute bottom-3 right-3 w-4 h-4 bg-green-500 rounded-full border-[3px] border-[#111112] z-20" />
            </div>
          </div>

          {/* Content Area - Flex Grow to distribute space */}
          <div className="flex-1 flex flex-col items-center w-full px-4 min-h-0 overflow-hidden">

            {/* Name, Badge & Handle */}
            <div className="text-center w-full mb-2 shrink-0">
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <h1 className="text-2xl font-bold text-white tracking-tight truncate max-w-[300px]">{user.name}</h1>
                {user.role === 'SUPER_ADMIN' && <Badge className="bg-purple-500 text-white hover:bg-purple-600 border-none px-1.5 py-0 h-5 text-[9px] uppercase font-bold tracking-wider"><Sparkles className="w-2.5 h-2.5 mr-0.5" />Admin</Badge>}
                {planLabel && (
                  <Badge variant="outline" className="border-orange-500/50 text-orange-400 px-1.5 py-0 h-5 text-[9px] uppercase font-bold tracking-wider">
                    {planLabel}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground font-medium text-sm">@{username}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-2 mb-2 shrink-0">
              {isOwnProfile ? (
                <EditProfileDialog
                  user={user}
                  triggerButton={
                    <Button className="h-8 px-5 rounded-full bg-white text-black hover:bg-white/90 font-semibold shadow-sm transition-transform hover:scale-105 text-xs">
                      Edit profile
                    </Button>
                  }
                />
              ) : (
                <Button className="h-8 px-6 rounded-full bg-white text-black hover:bg-white/90 font-semibold shadow-sm transition-transform hover:scale-105 text-xs">
                  Follow
                </Button>
              )}
              <Button variant="outline" className="h-8 w-8 p-0 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 shadow-sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* TABS NAVIGATION Bar - Pushed to bottom */}
          <div className="border-t border-white/[0.02] w-full bg-[#111112]/50 mt-auto shrink-0">
            <div className="flex items-center justify-center h-12">
              <div className="flex items-center gap-2 md:gap-6 overflow-x-auto scrollbar-none w-full md:w-auto justify-start md:justify-center px-4 h-full">
                {tabs.map((tab) => {
                  // const Icon = tab.icon; 
                  const isActive = currentFilter === tab.id;
                  const href = tab.id === 'ad_view' && adId
                    ? `/profile/${user.id}?filter=ad_view&adId=${adId}`
                    : `/profile/${user.id}?filter=${tab.id}`;

                  return (
                    <Link
                      key={tab.id}
                      href={href}
                      scroll={false}
                      className={cn(
                        "relative px-3 h-full flex items-center text-xs md:text-sm font-medium transition-colors whitespace-nowrap",
                        isActive
                          ? "text-white"
                          : "text-muted-foreground hover:text-white"
                      )}
                    >
                      {tab.label}
                      {(tab.id === 'posts' && stats.postsCount > 0) && <span className="ml-1 text-[10px] opacity-50 font-normal">{stats.postsCount}</span>}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full shadow-[0_-2px_8px_rgba(255,255,255,0.4)]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

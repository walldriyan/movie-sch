
'use client';

import { MoreHorizontal, Grid3x3, Bookmark, Users, Images, Clapperboard, Camera, BookCheck, MapPin, Calendar, ExternalLink, Sparkles, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import type { User } from '@prisma/client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EditProfileDialog from '@/components/edit-profile-dialog';
import { cn } from '@/lib/utils';

interface ProfileStats {
  postsCount: number;
  favoritesCount: number;
  followersCount: number;
  followingCount: number;
}

export default function ProfileHeader({ user, currentFilter, isOwnProfile, stats, adId, planLabel }: { user: User, currentFilter: string, isOwnProfile: boolean, stats: ProfileStats, adId?: string, planLabel?: string | null }) {
  const coverImage = user.coverImage || 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80';

  const userAvatar =
    user.image ||
    PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid3x3 },
    { id: 'series', label: 'Series', icon: Clapperboard },
    { id: 'favorites', label: 'Favorites', icon: Bookmark },
    { id: 'exams', label: 'Exams', icon: BookCheck },
  ];

  if (isOwnProfile) {
    tabs.push({ id: 'ads', label: 'My Ads', icon: Megaphone });
    tabs.push({ id: 'payments', label: 'Payments', icon: Bookmark }); // Using Bookmark or CreditCard from lucide if imported
  }

  // Dynamic Tab for Ad View
  if (currentFilter === 'ad_view') {
    tabs.push({ id: 'ad_view', label: 'Sponsored Ads', icon: Megaphone });
  }

  return (
    <div className="pt-24 md:pt-32 px-4 md:px-8 max-w-[1600px] mx-auto mb-8">
      {/* Hero Section */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-[#0a0a0a] group/hero mb-12">
        {/* Cover Image */}
        <div className="relative h-[350px] md:h-[450px] w-full">
          <Image
            src={coverImage}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Edit Cover Button */}
          {isOwnProfile && (
            <div className="absolute top-4 right-4 z-30 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300">
              <EditProfileDialog
                user={user}
                triggerButton={
                  <Button size="sm" variant="secondary" className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 gap-2">
                    <Camera className="w-4 h-4" />
                    Change Cover
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 z-20">
          <div className="flex flex-col md:flex-row items-end gap-6 md:gap-8">
            {/* Avatar - Elevated */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 md:w-36 md:h-36 rounded-3xl border-4 border-white/5 overflow-hidden bg-muted shadow-2xl relative z-10">
                <Avatar className="w-full h-full rounded-none">
                  {userAvatar && (
                    <AvatarImage src={userAvatar} alt={user.name || 'User'} className="object-cover" />
                  )}
                  <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-none">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Online Status */}
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0a0a] z-20 shadow-lg" />

              {/* === PLAN BADGE === */}
              {/* === PLAN BADGE === */}
              {planLabel && (
                <div className="absolute top-1/2 -right-3 md:-right-4 transform translate-x-1/2 -translate-y-1/2 z-30 hidden md:block">
                  <div className="px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white text-xs font-bold tracking-widest uppercase shadow-2xl animate-in fade-in zoom-in duration-500 whitespace-nowrap">
                    {planLabel}
                  </div>
                </div>
              )}
              {/* Mobile Badge Position */}
              {planLabel && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 md:hidden">
                  <div className="px-3 py-0.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase shadow-xl whitespace-nowrap">
                    {planLabel}
                  </div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-3 w-full mb-2">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  {user.role !== 'USER' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white border border-white/10 backdrop-blur-md text-xs font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      {user.role === 'SUPER_ADMIN' ? 'Administrator' : 'Creator'}
                    </span>
                  )}
                  <span className="text-white/60 text-sm flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
                  {user.name}
                </h1>
              </div>

              <p className="text-white/70 max-w-2xl text-base md:text-lg leading-relaxed line-clamp-2 drop-shadow-md">
                {user.bio || 'This user has not added a bio yet.'}
              </p>

              <div className="flex items-center gap-4 text-white/80 text-sm font-medium pt-1">
                <div className="flex items-center gap-1.5 transition-colors cursor-pointer hover:text-white">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white">{stats.followersCount}</span> Followers
                </div>
                <div className="flex items-center gap-1.5 transition-colors cursor-pointer hover:text-white">
                  <span className="font-bold text-white">{stats.followingCount}</span> Following
                </div>
                <div className="w-1 h-1 bg-white/30 rounded-full" />
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white">{stats.postsCount}</span> Posts
                </div>
              </div>

              {user.website && (
                <div className="pt-1">
                  <Link href={user.website} target="_blank" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-medium hover:underline">
                    <ExternalLink className="w-4 h-4" />
                    {user.website.replace(/^https?:\/\//, '')}
                  </Link>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto pb-1">
              {isOwnProfile ? (
                <EditProfileDialog
                  user={user}
                  triggerButton={
                    <Button className="flex-1 md:flex-none h-11 rounded-full text-base font-semibold bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border border-white/10 shadow-xl transition-transform hover:scale-105 px-6">
                      Edit Profile
                    </Button>
                  }
                />
              ) : (
                <Button className="flex-1 md:flex-none h-11 rounded-full text-base font-semibold bg-black/40 text-white hover:bg-black/60 backdrop-blur-md border border-white/10 shadow-xl transition-transform hover:scale-105 px-8">
                  Follow
                </Button>
              )}
              <Button size="icon" variant="outline" className="rounded-full w-11 h-11 bg-white/10 border-white/10 text-white hover:bg-white/20 backdrop-blur-md">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Floating Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 bg-white/[0.05] border border-white/5 p-1 rounded-full backdrop-blur-md h-auto shadow-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
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
                  "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-black/50 text-white shadow-md backdrop-blur-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'posts' && stats.postsCount > 0 && <span className="text-[10px] ml-1 opacity-60">({stats.postsCount})</span>}
                {tab.id === 'favorites' && stats.favoritesCount > 0 && <span className="text-[10px] ml-1 opacity-60">({stats.favoritesCount})</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

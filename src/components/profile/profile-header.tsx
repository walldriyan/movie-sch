
'use client';

import { MoreHorizontal, Grid3x3, Bookmark, Users, Images, Clapperboard, Camera, BookCheck, MapPin, Calendar, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import type { User } from '@prisma/client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EditProfileDialog from '@/components/edit-profile-dialog';
import { cn } from '@/lib/utils';

export default function ProfileHeader({ user, currentFilter, isOwnProfile }: { user: User, currentFilter: string, isOwnProfile: boolean }) {
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

  return (
    <div className="pt-[70px]">
      {/* Hero Banner Section */}
      <div className="relative mx-4 rounded-3xl overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-[280px] md:h-[320px]">
          <Image
            src={coverImage}
            alt="Cover"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-transparent" />

          {/* Edit Cover Button */}
          {isOwnProfile && (
            <div className="absolute top-4 right-4 z-20">
              <EditProfileDialog
                user={user}
                triggerButton={
                  <Button size="sm" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Edit Cover
                  </Button>
                }
              />
            </div>
          )}
        </div>

        {/* Profile Info - Overlapping the cover */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 border-background shadow-2xl">
                {userAvatar && (
                  <AvatarImage src={userAvatar} alt={user.name || 'User'} className="object-cover" />
                )}
                <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-background" />
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold text-white">{user.name}</h1>
                {user.role !== 'USER' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    {user.role === 'SUPER_ADMIN' ? 'Admin' : 'Creator'}
                  </span>
                )}
              </div>

              <p className="text-white/60 text-sm md:text-base max-w-xl line-clamp-2">
                {user.bio || 'No bio yet. Tell the world about yourself!'}
              </p>

              <div className="flex items-center gap-4 text-white/50 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                {user.website && (
                  <Link href={user.website} target="_blank" className="flex items-center gap-1.5 hover:text-purple-400 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </Link>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {isOwnProfile ? (
                <EditProfileDialog
                  user={user}
                  triggerButton={
                    <Button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full px-6">
                      Edit Profile
                    </Button>
                  }
                />
              ) : (
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-6 shadow-lg shadow-purple-500/25">
                  Follow
                </Button>
              )}
              <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">128</p>
              <p className="text-xs text-white/50">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">1.2K</p>
              <p className="text-xs text-white/50">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">48</p>
              <p className="text-xs text-white/50">Following</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white/[0.03] backdrop-blur-sm rounded-full p-1 border border-white/[0.06]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentFilter === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`/profile/${user.id}?filter=${tab.id}`}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

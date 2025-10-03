
'use client';

import { MoreHorizontal, Grid3x3, Bookmark, Users, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import type { User } from '@prisma/client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EditProfileDialog from '@/components/edit-profile-dialog';

export default function ProfileHeader({ user, currentFilter, isOwnProfile }: { user: User, currentFilter: string, isOwnProfile: boolean }) {
  const coverImage = PlaceHolderImages.find(
    (img) => img.id === 'movie-poster-placeholder'
  );
  
  const userAvatar =
  user.image ||
  PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  return (
    <div className="border-b bg-background">
      <div className="relative h-48">
        {coverImage && (
            <Image
                src={coverImage.imageUrl}
                alt="Cover image"
                fill
                className="object-cover"
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 flex items-end justify-between">
            <div className="flex items-end gap-4">
                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background">
                    {userAvatar && (
                        <AvatarImage src={userAvatar} alt={user.name || 'User'} />
                    )}
                    <AvatarFallback>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
                <div className="pb-4">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">1.2K Followers</p>
                </div>
            </div>
            <div className="flex items-center gap-2 pb-4">
                {isOwnProfile ? (
                <EditProfileDialog user={user} />
                ) : (
                <Button variant="outline">Follow</Button>
                )}
                <Button variant="ghost" size="icon">
                <MoreHorizontal />
                </Button>
            </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-2 pb-px overflow-x-auto no-scrollbar">
             <Button asChild variant={currentFilter === 'posts' ? 'secondary' : 'ghost'} className="rounded-full whitespace-nowrap">
                <Link href={`/profile/${user.id}?filter=posts`}><Grid3x3 className="mr-2 h-4 w-4" /> My Posts</Link>
             </Button>
              <Button asChild variant={currentFilter === 'favorites' ? 'secondary' : 'ghost'} className="rounded-full whitespace-nowrap">
                <Link href={`/profile/${user.id}?filter=favorites`}><Bookmark className="mr-2 h-4 w-4" /> Favorites</Link>
             </Button>
              <Button variant="ghost" className="rounded-full whitespace-nowrap" disabled>
                <Users className="mr-2 h-4 w-4" /> Followers
             </Button>
              <Button variant="ghost" className="rounded-full whitespace-nowrap" disabled>
                <Images className="mr-2 h-4 w-4" /> Images
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

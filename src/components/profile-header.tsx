'use client';

import { MoreHorizontal, Search, Grid3x3, Bookmark, Users, Images } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { User } from '@prisma/client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import EditProfileDialog from './edit-profile-dialog';

export default function ProfileHeader({ user, currentFilter, isOwnProfile }: { user: User, currentFilter: string, isOwnProfile: boolean }) {
  const coverImage = PlaceHolderImages.find(
    (img) => img.id === 'movie-poster-placeholder'
  );
  
  const userAvatar =
  user.image ||
  PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  return (
    <div className="sticky top-16 bg-background/95 backdrop-blur-sm z-30 border-b">
       <div className="relative h-48 -mt-8 rounded-b-2xl overflow-hidden">
        {coverImage && (
            <Image
                src={coverImage.imageUrl}
                alt="Cover image"
                fill
                className="object-cover blur-sm opacity-50"
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
         <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-end justify-between h-16 relative z-10 -mt-20">
          <div className="flex items-end gap-4">
            <Avatar className="w-24 h-24 border-4 border-background">
                {userAvatar && (
                    <AvatarImage src={userAvatar} alt={user.name || 'User'} />
                )}
                <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">1.2K Followers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end pb-2">
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
          <div className="flex items-center gap-2 pb-[5px] overflow-x-auto no-scrollbar">
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

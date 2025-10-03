'use client';

import { MoreHorizontal, Search, Grid3x3, Bookmark, Users, Images } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { User } from '@prisma/client';
import Link from 'next/link';

export default function ProfileHeader({ user, currentFilter }: { user: User, currentFilter: string }) {
  const coverImage = PlaceHolderImages.find(
    (img) => img.id === 'movie-poster-placeholder'
  );
  
  return (
    <div className="sticky top-16 bg-background/95 backdrop-blur-sm z-30 -mx-4 px-4">
       <div className="relative h-48 -mx-4 -mt-8 rounded-b-2xl overflow-hidden">
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between h-16 relative z-10 -mt-8">
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">1.2K Followers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">Follow</Button>
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
        <Separator />
      </div>
    </div>
  );
}

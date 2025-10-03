'use client';

import { MoreHorizontal, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { User } from '@prisma/client';

export default function ProfileHeader({ user }: { user: User }) {
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
        <Separator />
      </div>
    </div>
  );
}

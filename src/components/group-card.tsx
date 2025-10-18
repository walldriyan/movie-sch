
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GroupWithCount } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Users } from 'lucide-react';

interface GroupCardProps {
    group: GroupWithCount & { posts: { posterUrl: string | null }[] };
}

export default function GroupCard({ group }: GroupCardProps) {
  const groupImage = group.profilePhoto || group.posts[0]?.posterUrl || PlaceHolderImages.find(p => p.id === 'movie-poster-placeholder')?.imageUrl;

  return (
    <Link href={`/groups/${group.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1 h-full flex flex-col">
        <div className="aspect-video relative">
          {groupImage && (
            <Image
              src={groupImage}
              alt={`Image for ${group.name}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          )}
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
           <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs text-white bg-black/50 px-2 py-1 rounded-full">
              <Users className="h-3 w-3" />
              <span>{group._count.members}</span>
           </div>
        </div>
        <CardHeader className="flex-grow p-4">
          <CardTitle className="group-hover:text-primary text-base">
            {group.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
        </CardHeader>
      </Card>
    </Link>
  );
}

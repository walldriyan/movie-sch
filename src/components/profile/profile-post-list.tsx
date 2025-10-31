
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Pencil, VideoOff } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Post, User } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProfilePostListProps {
  posts: Post[];
  isOwnProfile: boolean;
  currentFilter: string;
  profileUser: User;
}

function PostGridCard({ post }: { post: Post }) {
    const postImageUrl =
    post.posterUrl ||
    PlaceHolderImages.find(
      (p) => p.id === 'movie-poster-placeholder'
    )?.imageUrl;

  return (
    <Link href={`/movies/${post.id}`} className="group block">
        <Card className="overflow-hidden transition-all duration-300 h-full flex flex-col bg-muted/30">
             <div className="aspect-video relative">
                {postImageUrl && (
                    <Image
                        src={postImageUrl}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                    />
                )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
             </div>
             <CardContent className="p-4 flex-grow flex flex-col">
                <h3 className="font-semibold text-sm group-hover:text-primary flex-grow">{post.title}</h3>
                <div className="text-xs text-muted-foreground line-clamp-1 mt-1" dangerouslySetInnerHTML={{ __html: post.description || ''}} />
                <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        <span>{post._count?.likedBy || 0}</span>
                    </div>
                     <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{post._count?.reviews || 0}</span>
                    </div>
                </div>
             </CardContent>
        </Card>
    </Link>
  );
}


export default function ProfilePostList({ posts, isOwnProfile, currentFilter, profileUser }: ProfilePostListProps) {
  if (posts.length === 0) {
    return (
      <Card className="text-center border-dashed">
        <CardContent className="p-16 flex flex-col items-center gap-4">
          <VideoOff className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            {currentFilter === 'posts' ? 'No Posts Yet' : 'No Favorites Yet'}
          </h3>
          <p className="text-muted-foreground">
            {currentFilter === 'posts'
              ? `${profileUser.name} hasn't posted any content yet.`
              : `No favorite content to display.`}
          </p>
           {isOwnProfile && currentFilter === 'posts' && (
                <Button asChild className="mt-4">
                    <Link href="/manage?create=true">
                        <Pencil className="mr-2 h-4 w-4" /> Create First Post
                    </Link>
                </Button>
           )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {posts.map((post: any) => (
          <PostGridCard 
              key={`${currentFilter}-${post.id}`} 
              post={post}
          />
      ))}
    </div>
  );
}

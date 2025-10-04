
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, VideoOff, Pencil } from 'lucide-react';
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
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      {posts.map((post: any) => {
        const postImageUrl =
          post.posterUrl ||
          PlaceHolderImages.find(
            (p) => p.id === 'movie-poster-placeholder'
          )?.imageUrl;

        return (
          <article key={post.id}>
            <div className="flex items-center space-x-3 mb-4 text-sm">
              <span className="text-muted-foreground">{post.year}</span>
            </div>

            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-8">
                <Link href={`/movies/${post.id}`} className="group block mb-2">
                  <h2 className="font-serif text-2xl font-bold leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                </Link>
                <div
                  className="prose prose-sm prose-invert text-muted-foreground mt-2 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: post.description }}
                />
              </div>
              <div className="col-span-4 relative group">
                {postImageUrl && (
                  <Link
                    href={`/movies/${post.id}`}
                    className="block aspect-video relative overflow-hidden rounded-md"
                  >
                    <Image
                      src={postImageUrl}
                      alt={post.title}
                      fill
                      className="object-cover rounded-2xl"
                    />
                  </Link>
                )}
                {isOwnProfile && currentFilter === 'posts' && (
                  <Button asChild size="sm" className="absolute top-2 right-2">
                    <Link href={`/manage?edit=${post.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{post.imdbRating?.toFixed(1)}</span>
              </div>
              <span>&middot;</span>
              <span>{post.duration}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

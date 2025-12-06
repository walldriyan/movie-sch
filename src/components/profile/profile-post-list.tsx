
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Pencil, VideoOff, Play, Eye, Clapperboard } from 'lucide-react';
import type { Post, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ProfilePostListProps {
  posts: Post[];
  isOwnProfile: boolean;
  currentFilter: string;
  profileUser: User;
}

function PostGridCard({ post }: { post: Post }) {
  const [imgError, setImgError] = useState(false);
  const hasValidImage = post.posterUrl && post.posterUrl.trim() !== '' && !imgError;

  return (
    <Link href={`/movies/${post.id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#1a1a1a] hover:border-white/[0.12] transition-all duration-300">
        {/* Image Container */}
        <div className="aspect-[16/9] relative overflow-hidden">
          {hasValidImage ? (
            <Image
              src={post.posterUrl!}
              alt={post.title}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1f1f1f] via-[#181818] to-[#141414]">
              <div className="absolute inset-0 flex items-center justify-center">
                <Clapperboard className="w-10 h-10 text-white/[0.06]" />
              </div>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Hover Play Button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/30">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
              <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
            </div>
          </div>

          {/* Status Badge */}
          {post.status && post.status !== 'PUBLISHED' && (
            <div className="absolute top-3 left-3 z-10">
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                post.status === 'PENDING_APPROVAL' && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                post.status === 'DRAFT' && "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              )}>
                {post.status.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-base line-clamp-1 group-hover:text-purple-400 transition-colors">
            {post.title}
          </h3>

          {post.year && (
            <p className="text-white/40 text-xs mt-1">{post.year}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 text-white/40 text-xs">
              <Heart className="w-3.5 h-3.5" />
              <span>{post._count?.likedBy || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/40 text-xs">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{post._count?.reviews || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/40 text-xs ml-auto">
              <Eye className="w-3.5 h-3.5" />
              <span>{post.viewCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}


export default function ProfilePostList({ posts, isOwnProfile, currentFilter, profileUser }: ProfilePostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/[0.03] flex items-center justify-center">
          <VideoOff className="w-10 h-10 text-white/20" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          {currentFilter === 'posts' ? 'No Posts Yet' : 'No Favorites Yet'}
        </h3>
        <p className="text-white/40 text-sm max-w-sm mx-auto mb-6">
          {currentFilter === 'posts'
            ? `${profileUser.name} hasn't posted any content yet.`
            : `No favorite content to display.`}
        </p>
        {isOwnProfile && currentFilter === 'posts' && (
          <Button
            asChild
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-6"
          >
            <Link href="/manage?create=true">
              <Pencil className="mr-2 h-4 w-4" />
              Create First Post
            </Link>
          </Button>
        )}
      </div>
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

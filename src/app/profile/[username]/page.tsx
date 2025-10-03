

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Star, Link as LinkIcon, Twitter, Linkedin, ShieldCheck, Pencil, Hourglass, CheckCircle2, XCircle, VideoOff, Bookmark, Images, Users, Grid3x3 } from 'lucide-react';
import React from 'react';
import type { User as PrismaUser } from '@prisma/client';
import type { Movie } from '@/lib/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import ProfileHeader from '@/components/profile-header';
import { getMovies, getUsers, getFavoriteMoviesByUserId } from '@/lib/actions';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EditProfileDialog from '@/components/edit-profile-dialog';
import { Button } from '@/components/ui/button';
import { ROLES } from '@/lib/permissions';
import RequestAccessDialog from '@/components/request-access-dialog';
import { cn } from '@/lib/utils';
import ProfilePostList from '@/components/profile-post-list';
import ProfileSidebar from '@/components/profile-sidebar';

export default async function ProfilePage({ 
  params,
  searchParams,
}: { 
  params: { username: string },
  searchParams: { filter?: string, edit?: string } 
}) {
  const session = await auth();
  const loggedInUser = session?.user;
  const currentFilter = searchParams.filter || 'posts';

  // Fetch the user whose profile is being viewed
  const allUsers = await getUsers();
  const profileUser = allUsers.find(u => u.id === params.username) as PrismaUser | undefined;

  if (!profileUser) {
    notFound();
  }

  const isOwnProfile = loggedInUser?.id === profileUser.id;

  let displayMovies: Movie[] = [];
  if (currentFilter === 'posts') {
    const { movies: allMovies } = await getMovies({ filters: { authorId: profileUser.id, includePrivate: isOwnProfile } });
    displayMovies = allMovies;
  } else if (currentFilter === 'favorites') {
    displayMovies = await getFavoriteMoviesByUserId(profileUser.id);
  }

  
  const userAvatar =
    profileUser.image ||
    PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  const showRequestAccess = isOwnProfile && loggedInUser?.role === ROLES.USER && profileUser.permissionRequestStatus !== 'APPROVED';

  return (
    <>
       <ProfileHeader user={profileUser} currentFilter={currentFilter} isOwnProfile={isOwnProfile}/>
      <main className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between gap-12 pt-12 px-4">
          <div className="w-full md:w-2/3">
            <ProfilePostList
              movies={displayMovies}
              isOwnProfile={isOwnProfile}
              currentFilter={currentFilter}
              profileUser={profileUser}
            />
          </div>
          <aside className="w-full md:w-80">
             <div className="md:sticky top-40">
                <ProfileSidebar profileUser={profileUser} loggedInUser={loggedInUser} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}



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
import { ScrollArea } from '@/components/ui/scroll-area';

const PermissionStatusIndicator = ({ status }: { status: string | null }) => {
  if (!status || status === 'NONE') return null;

  const statusMap = {
    PENDING: {
      icon: <Hourglass className="h-4 w-4" />,
      text: 'Permission request is pending approval.',
      className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      description: null,
    },
    APPROVED: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      text: 'Request Approved',
      className: 'bg-green-500/10 text-green-400 border-green-500/20',
      description: 'Your role has been updated. Please log out and log back in to see the changes.',
    },
    REJECTED: {
      icon: <XCircle className="h-4 w-4" />,
      text: 'Request Rejected',
      className: 'bg-red-500/10 text-red-400 border-red-500/20',
      description: 'Your request was not approved. You can submit another request if needed.',
    },
  };

  const currentStatus = statusMap[status as keyof typeof statusMap];
  if (!currentStatus) return null;

  return (
    <div className={`mt-4 rounded-lg p-3 text-sm border ${currentStatus.className}`}>
      <div className="flex items-center gap-3 font-semibold">
        {currentStatus.icon}
        <span>{currentStatus.text}</span>
      </div>
      {currentStatus.description && (
        <p className="text-xs mt-2 ml-1">{currentStatus.description}</p>
      )}
    </div>
  );
};


export default async function ProfilePage({ 
  params,
  searchParams,
}: { 
  params: { username: string },
  searchParams: { filter?: string } 
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
    <div className="w-full bg-background text-foreground">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ProfileHeader user={profileUser} currentFilter={currentFilter} />
        
        <div className="flex flex-col md:flex-row gap-12 mt-10">
          {/* Left side - Posts */}
          <div className="w-full md:w-2/3 space-y-12">
            {displayMovies.map((movie: any) => {
              const movieImageUrl =
                movie.posterUrl ||
                PlaceHolderImages.find(
                  (p) => p.id === 'movie-poster-placeholder'
                )?.imageUrl;

              return (
                <article key={movie.id}>
                  <div className="flex items-center space-x-3 mb-4 text-sm">
                    <span className="text-muted-foreground">{movie.year}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-8">
                      <Link href={`/movies/${movie.id}`} className="group block mb-2">
                        <h2 className="font-serif text-2xl font-bold leading-snug group-hover:text-primary transition-colors">
                            {movie.title}
                        </h2>
                      </Link>
                      <div
                        className="prose prose-sm prose-invert text-muted-foreground mt-2 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: movie.description }}
                      />
                    </div>
                    <div className="col-span-4">
                      {movieImageUrl && (
                        <Link
                          href={`/movies/${movie.id}`}
                          className="block aspect-video relative overflow-hidden rounded-md"
                        >
                          <Image
                            src={movieImageUrl}
                            alt={movie.title}
                            fill
                            className="object-cover rounded-2xl"
                          />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span>{movie.imdbRating.toFixed(1)}</span>
                    </div>
                    <span>&middot;</span>
                    <span>{movie.duration}</span>
                  </div>
                </article>
              );
            })}
             {displayMovies.length === 0 && (
                <Card className="text-center border-dashed">
                  <CardContent className="p-16 flex flex-col items-center gap-4">
                    <VideoOff className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">
                      {currentFilter === 'posts' ? 'No Movies Yet' : 'No Favorites Yet'}
                    </h3>
                    <p className="text-muted-foreground">
                      {currentFilter === 'posts' 
                        ? `${profileUser.name} hasn't posted any movies yet.`
                        : `No favorite movies to display.`}
                    </p>
                  </CardContent>
                </Card>
             )}
          </div>

          {/* Right side - Profile Info */}
          <aside className="w-full md:w-1/3">
            <div className="md:sticky top-24 space-y-6">
              <div className="flex justify-between items-start">
                <Avatar className="w-16 h-16">
                  {userAvatar && (
                    <AvatarImage src={userAvatar} alt={profileUser.name || 'User'} />
                  )}
                  <AvatarFallback>
                    {profileUser.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && <EditProfileDialog user={profileUser} />}
              </div>
              <h3 className="text-xl font-semibold">{profileUser.name}</h3>
              {profileUser.bio && (
                <p className="text-muted-foreground text-sm">
                  {profileUser.bio}
                </p>
              )}
              <Separator />
              <div className="flex items-center gap-4 text-muted-foreground">
                {profileUser.website && (
                  <Link
                    href={profileUser.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    <LinkIcon className="w-5 h-5" />
                  </Link>
                )}
                {profileUser.twitter && (
                  <Link
                    href={profileUser.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    <Twitter className="w-5 h-5" />
                  </Link>
                )}
                {profileUser.linkedin && (
                  <Link
                    href={profileUser.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    <Linkedin className="w-5 h-5" />
                  </Link>
                )}
              </div>

              {isOwnProfile && loggedInUser && (
                <>
                  <Separator />
                  <Card className='border-0 shadow-none -mx-6 bg-transparent'>
                    <CardHeader className='px-6'>
                      <CardTitle className="text-lg">My Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 px-6">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground">Email</h4>
                        <p className="text-sm">{loggedInUser.email}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground">Role</h4>
                        <div className="text-sm">
                           <Badge variant={loggedInUser.role === ROLES.SUPER_ADMIN ? 'default' : loggedInUser.role === ROLES.USER_ADMIN ? 'secondary' : 'outline'}>
                            {loggedInUser.role}
                          </Badge>
                        </div>
                      </div>
                       <div className="mt-4">
                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                          <ShieldCheck className="h-4 w-4"/>
                          Permissions
                        </h4>
                        {loggedInUser.permissions && loggedInUser.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {loggedInUser.permissions.map(permission => (
                              <Badge key={permission} variant="outline" className="font-mono text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No special permissions.</p>
                        )}
                      </div>
                       {showRequestAccess && (
                        <div>
                          <Separator className="my-4" />
                          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                            Become a Contributor
                          </h4>
                           <p className="text-xs text-muted-foreground mb-3">
                            Want to add or manage movies? Request admin access to become a contributor.
                          </p>
                          <RequestAccessDialog user={profileUser} />
                        </div>
                       )}
                       <PermissionStatusIndicator status={profileUser.permissionRequestStatus} />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

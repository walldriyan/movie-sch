import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Star, Link as LinkIcon, Twitter, Linkedin, ShieldCheck } from 'lucide-react';
import React from 'react';
import type { Movie } from '@prisma/client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import ProfileHeader from '@/components/profile-header';
import { getMovies, getUsers } from '@/lib/actions';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types';


const staticProfileData = {
  bio: 'Bringing you the latest and greatest in the world of cinema. I curate movie lists, write reviews, and help you discover your next favorite film. Join me on this cinematic journey!',
  website: 'https://cineverse.example.com',
  twitter: 'https://twitter.com/cineverse',
  linkedin: 'https://linkedin.com/in/cineverse',
};

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const session = await auth();
  const loggedInUser = session?.user;

  // Fetch the user whose profile is being viewed
  const allUsers = await getUsers();
  const profileUser = allUsers.find(u => u.id === params.username) as User | undefined;

  if (!profileUser) {
    notFound();
  }

  const isOwnProfile = loggedInUser?.id === profileUser.id;

  const allMovies = (await getMovies()) as Movie[];
  const userAvatar =
    profileUser.image ||
    PlaceHolderImages.find((img) => img.id === 'avatar-4')?.imageUrl;

  return (
    <div className="w-full bg-background text-foreground">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ProfileHeader username={profileUser.name || 'User'} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-10">
          {/* Left side - Posts */}
          <div className="md:col-span-2 space-y-12">
            {allMovies.map((movie) => {
              const movieImageUrl =
                (movie.galleryImageIds &&
                (movie.galleryImageIds as any).length > 0
                  ? (movie.galleryImageIds as any)[0]
                  : movie.posterUrl) ||
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
                      <Link href={`/movies/${movie.id}`} className="group">
                        <h2 className="font-serif text-2xl font-bold leading-snug group-hover:text-primary transition-colors">
                          {movie.title}
                        </h2>
                        <div
                          className="prose prose-sm prose-invert text-muted-foreground mt-2 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: movie.description }}
                        />
                      </Link>
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
                            className="object-cover"
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
          </div>

          {/* Right side - Profile Info */}
          <div className="md:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Avatar className="w-16 h-16">
                {userAvatar && (
                  <AvatarImage src={userAvatar} alt={profileUser.name || 'User'} />
                )}
                <AvatarFallback>
                  {profileUser.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{profileUser.name}</h3>
              <p className="text-muted-foreground text-sm">
                {staticProfileData.bio}
              </p>
              <Separator />
              <div className="flex items-center gap-4 text-muted-foreground">
                <Link
                  href={staticProfileData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  <LinkIcon className="w-5 h-5" />
                </Link>
                <Link
                  href={staticProfileData.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link
                  href={staticProfileData.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  <Linkedin className="w-5 h-5" />
                </Link>
              </div>

              {isOwnProfile && loggedInUser && (
                <>
                  <Separator />
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">My Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground">Email</h4>
                        <p className="text-sm">{loggedInUser.email}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground">Role</h4>
                        <p className="text-sm">
                          <Badge variant={loggedInUser.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                            {loggedInUser.role}
                          </Badge>
                        </p>
                      </div>
                       <div>
                        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4"/>
                          Permissions
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {loggedInUser.permissions?.map(permission => (
                            <Badge key={permission} variant="outline" className="font-mono text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

    
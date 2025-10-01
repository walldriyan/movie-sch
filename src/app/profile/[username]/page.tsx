'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Star, MoreHorizontal, Link as LinkIcon, Twitter, Linkedin } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { Movie } from '@/lib/types';
import Loading from '../../loading';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import ProfileHeader from '@/components/profile-header';

const LOCAL_STORAGE_KEY = 'movies_data';

const userProfile = {
  name: 'CineVerse Editor',
  username: 'cineverse-editor',
  avatarId: 'avatar-1',
  bio: 'Bringing you the latest and greatest in the world of cinema. I curate movie lists, write reviews, and help you discover your next favorite film. Join me on this cinematic journey!',
  followers: '1.2K',
  website: 'https://cineverse.example.com',
  twitter: 'https://twitter.com/cineverse',
  linkedin: 'https://linkedin.com/in/cineverse',
};


export default function ProfilePage({ params: { username } }: { params: { username: string } }) {
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedMovies = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedMovies) {
        setAllMovies(JSON.parse(storedMovies));
      } else {
        setAllMovies([]);
      }
    } catch (error) {
      console.error("Could not parse movies from localStorage", error);
      setAllMovies([]);
    }
  }, []);

  if (!isMounted) {
    return <Loading />;
  }
  
  const authorAvatar = PlaceHolderImages.find(img => img.id === userProfile.avatarId);

  return (
    <div className="w-full bg-background text-foreground">
      <Header />
      <ProfileHeader username={userProfile.name} />

      <main className='max-w-4xl mx-auto px-4 py-8'>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Left side - Posts */}
            <div className='md:col-span-2 space-y-12'>
                 {allMovies.map(movie => {
                    const movieImageUrl = 
                    (movie.galleryImageIds && movie.galleryImageIds.length > 0 ? movie.galleryImageIds[0] : movie.posterUrl) ||
                    PlaceHolderImages.find(p => p.id === 'movie-poster-placeholder')?.imageUrl;

                    return (
                    <article key={movie.id}>
                        <div className="flex items-center space-x-3 mb-4 text-sm">
                            <span className='text-muted-foreground'>{movie.year}</span>
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
                            <Link href={`/movies/${movie.id}`} className="block aspect-video relative overflow-hidden rounded-md">
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
                    )
                })}
            </div>

            {/* Right side - Profile Info */}
            <div className="md:col-span-1">
                <div className="sticky top-24 space-y-6">
                    <Avatar className='w-16 h-16'>
                        {authorAvatar && <AvatarImage src={authorAvatar.imageUrl} alt={userProfile.name} data-ai-hint={authorAvatar.imageHint} />}
                        <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className='text-xl font-semibold'>{userProfile.name}</h3>
                    <p className='text-muted-foreground text-sm'>{userProfile.bio}</p>
                    <Separator />
                    <div className='flex items-center gap-4 text-muted-foreground'>
                         <Link href={userProfile.website} target="_blank" rel="noopener noreferrer" className='hover:text-primary'><LinkIcon className='w-5 h-5' /></Link>
                         <Link href={userProfile.twitter} target="_blank" rel="noopener noreferrer" className='hover:text-primary'><Twitter className='w-5 h-5' /></Link>
                         <Link href={userProfile.linkedin} target="_blank" rel="noopener noreferrer" className='hover:text-primary'><Linkedin className='w-5 h-5' /></Link>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

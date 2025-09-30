'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Header from '@/components/header';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { Movie } from '@/lib/types';
import Loading from './loading';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const LOCAL_STORAGE_KEY = 'movies_data';

export default function HomePage() {
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
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      }
    } catch (error) {
      console.error("Could not parse movies from localStorage", error);
      setAllMovies([]);
    }
  }, []);

  if (!isMounted) {
    return <Loading />;
  }
  
  if (allMovies.length === 0) {
    return (
      <div className="w-full bg-background text-foreground">
        <Header />
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 text-center">
          <div className='max-w-md'>
            <h1 className="font-serif text-4xl font-bold">Your Catalog is Empty</h1>
            <p className="mt-4 text-lg text-muted-foreground">Start by adding your favorite movies to build your personal CineVerse.</p>
             <Button asChild className="mt-6" size="lg">
              <Link href="/manage">Add Your First Movie</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const authorAvatar = PlaceHolderImages.find(img => img.id === 'avatar-1');

  return (
    <div className="w-full bg-background text-foreground">
      <Header />
      <main className='max-w-4xl mx-auto px-4 py-8'>
        <div className='space-y-12'>
          {allMovies.map(movie => {
            const movieImageUrl = movie.galleryImageIds.length > 0 
              ? PlaceHolderImages.find(p => p.id === movie.galleryImageIds[0])?.imageUrl
              : movie.posterUrl;

            return (
              <article key={movie.id}>
                <div className="flex items-center space-x-3 mb-4 text-sm">
                  <Avatar className='w-6 h-6'>
                      {authorAvatar && <AvatarImage src={authorAvatar.imageUrl} alt="Author" data-ai-hint={authorAvatar.imageHint} />}
                      <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <span className='font-medium text-foreground'>CineVerse Editor</span>
                  <span className='text-muted-foreground'>{movie.year}</span>
                </div>

                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-8">
                    <Link href={`/movies/${movie.id}`} className="group">
                      <h2 className="font-serif text-2xl font-bold leading-snug group-hover:text-primary transition-colors">
                        {movie.title}
                      </h2>
                      <p className="text-muted-foreground mt-2 line-clamp-2 text-base">
                        {Array.isArray(movie.description) ? movie.description[0] : movie.description}
                      </p>
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
      </main>
    </div>
  );
}

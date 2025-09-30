'use client';

import { useState, useEffect } from 'react';
import type { Movie } from '@/lib/types';
import { getMovieRecommendations, MovieRecommendationOutput } from '@/ai/flows/ai-movie-recommendation';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { XCircle, Star } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


interface MovieRecommendationsProps {
  currentMovie: Movie;
}

export default function MovieRecommendations({ currentMovie }: MovieRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<MovieRecommendationOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const authorAvatar = PlaceHolderImages.find(img => img.id === 'avatar-2');


  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        setError(null);
        const result = await getMovieRecommendations({
          movieTitle: currentMovie.title,
          movieDescription: currentMovie.description,
        });
        setRecommendations(result);
      } catch (e) {
        console.error('Failed to get movie recommendations:', e);
        setError('Could not load recommendations at this time.');
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, [currentMovie]);

  if (loading) {
    return (
      <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
           <div key={i} className="flex items-center gap-8">
              <div className="flex-grow space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-24 w-32 flex-shrink-0" />
           </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return <p className="text-muted-foreground">No recommendations available.</p>;
  }

  return (
    <div className="space-y-12">
      {recommendations.recommendations.map((rec) => (
        <article key={rec.title}>
            <div className="flex items-center space-x-3 mb-4 text-sm">
                <Avatar className='w-6 h-6'>
                    {authorAvatar && <AvatarImage src={authorAvatar.imageUrl} alt="Author" data-ai-hint={authorAvatar.imageHint} />}
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <span className='font-medium text-foreground'>AI Recommender</span>
            </div>
            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8">
                    <h3 className="font-serif text-2xl font-bold leading-snug">
                        {rec.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-base">
                       {rec.description}
                    </p>
                    <p className="mt-2 text-sm text-foreground/50 italic line-clamp-2">
                       Reason: {rec.reason}
                    </p>
                </div>
            </div>
        </article>
      ))}
    </div>
  );
}

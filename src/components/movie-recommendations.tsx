'use client';

import { useState, useEffect } from 'react';
import type { Movie } from '@/lib/types';
import { getMovieRecommendations, MovieRecommendationOutput } from '@/ai/flows/ai-movie-recommendation';
import MovieCard from './movie-card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { XCircle } from 'lucide-react';

interface MovieRecommendationsProps {
  currentMovie: Movie;
}

export default function MovieRecommendations({ currentMovie }: MovieRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<MovieRecommendationOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        setError(null);
        const result = await getMovieRecommendations({
          movieTitle: currentMovie.title,
          movieDescription: Array.isArray(currentMovie.description) ? currentMovie.description.join(' ') : currentMovie.description,
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-[250px] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
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
    return <p>No recommendations found.</p>;
  }

  // This component will now only show AI recommendations.
  // We cannot link to real movies as they may not exist in localStorage.
  // The MovieCard requires a valid movie ID to link to.
  // Since we cannot guarantee this, we will display the recommendation details without making them cards.

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {recommendations.recommendations.map((rec) => (
        <div key={rec.title} className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="font-semibold">{rec.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{rec.description}</p>
          <p className="mt-4 text-xs italic text-muted-foreground/80">Reason: {rec.reason}</p>
        </div>
      ))}
    </div>
  );
}

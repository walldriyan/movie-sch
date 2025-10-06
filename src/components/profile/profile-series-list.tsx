
'use client';

import type { User, Series } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clapperboard } from 'lucide-react';
import SeriesStepper from './series-stepper';
import Link from 'next/link';

interface ProfileSeriesListProps {
  series: Series[];
  isOwnProfile: boolean;
  profileUser: User;
  totalSeries: number;
  showAll: boolean;
}

export default function ProfileSeriesList({ series, isOwnProfile, profileUser, totalSeries, showAll }: ProfileSeriesListProps) {
  if (series.length === 0) {
    return (
      <Card className="text-center border-dashed">
        <CardContent className="p-16 flex flex-col items-center gap-4">
          <Clapperboard className="h-16 w-16 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Series Yet</h3>
          <p className="text-muted-foreground">
            {isOwnProfile
              ? "You haven't created any series yet."
              : `${profileUser.name} hasn't created any series yet.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      {series.map((s) => (
        <SeriesStepper key={s.id} series={s} />
      ))}
      
      {!showAll && totalSeries > 3 && (
        <div className="text-center mt-12">
            <Button asChild variant="outline">
                <Link href={`/profile/${profileUser.id}?filter=series&show-all-series=true`}>
                    View All {totalSeries} Series
                </Link>
            </Button>
        </div>
      )}
    </div>
  );
}

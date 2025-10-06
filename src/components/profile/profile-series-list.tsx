
'use client';

import type { User, Series } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Clapperboard } from 'lucide-react';
import SeriesStepper from './series-stepper';

interface ProfileSeriesListProps {
  series: Series[];
  isOwnProfile: boolean;
  profileUser: User;
}

export default function ProfileSeriesList({ series, isOwnProfile, profileUser }: ProfileSeriesListProps) {
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
    </div>
  );
}

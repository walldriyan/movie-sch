
'use client';

import { useState, useEffect } from 'react';
import { formatRelative } from 'date-fns';
import { Skeleton } from './ui/skeleton';

interface ClientRelativeDateProps {
  date: Date | string;
}

export default function ClientRelativeDate({ date }: ClientRelativeDateProps) {
  const [relativeDate, setRelativeDate] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only on the client after hydration
    const formatted = formatRelative(new Date(date), new Date());
    setRelativeDate(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, [date]);

  // On the server and during initial client render, render a placeholder
  if (!relativeDate) {
    return <Skeleton className="h-4 w-20" />;
  }

  // After hydration on the client, render the actual relative date
  return <span className="text-muted-foreground cursor-default">{relativeDate}</span>;
}

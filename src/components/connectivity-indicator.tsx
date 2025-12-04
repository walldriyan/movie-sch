
'use client';

import React from 'react';
import { useConnectivity } from '@/context/connectivity-context';
import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

export default function ConnectivityIndicator() {
  const { isOnline } = useConnectivity();

  return (
    <span
      className="absolute right-0 top-0 block h-3 w-3 rounded-full border-2 border-background"
      title={isOnline ? 'Online' : 'Offline'}
    >
      <Circle
        className={cn(
          'h-full w-full',
          isOnline ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'
        )}
      />
    </span>
  );
}

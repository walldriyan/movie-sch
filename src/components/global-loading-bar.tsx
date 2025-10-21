
'use client';

import { useLoading } from '@/context/loading-context';

export default function GlobalLoadingBar() {
  const { isLoading } = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[100] overflow-hidden bg-primary/20">
      <div className="h-full bg-primary animate-loading-bar"></div>
    </div>
  );
}

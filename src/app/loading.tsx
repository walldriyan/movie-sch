import React from 'react';

export default function Loading() {
  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[100] overflow-hidden bg-primary/20">
      <div className="h-full bg-primary animate-loading-bar"></div>
    </div>
  );
}

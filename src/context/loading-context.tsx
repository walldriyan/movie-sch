
'use client';

import React, { createContext, useContext, useState, useTransition } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(action: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const [loadingRequests, setLoadingRequests] = useState(0);

  const isLoading = isPending || loadingRequests > 0;

  const startLoading = () => setLoadingRequests((count) => count + 1);
  const stopLoading = () => setLoadingRequests((count) => Math.max(0, count - 1));

  // A helper function to wrap promises
  const withLoading = async <T,>(action: () => Promise<T>): Promise<T> => {
    startLoading();
    try {
      // Use startTransition for any state updates resulting from the action
      let result: T | undefined;
      await new Promise<void>(resolve => {
        startTransition(async () => {
          result = await action();
          resolve();
        });
      });
      return result!;
    } finally {
      stopLoading();
    }
  };

  const value = {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

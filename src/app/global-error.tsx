
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error("===== Global Uncaught Error =====", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="w-full bg-background text-foreground">
          <main className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8 text-center">
              <div className="max-w-lg">
                  <h1 className="text-5xl font-bold text-destructive">500</h1>
                  <h2 className="mt-4 font-serif text-3xl font-bold">Something Went Wrong</h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                      We've encountered an unexpected issue. Please try again. If the problem persists, the error has been logged.
                  </p>
                  <Button onClick={() => reset()} className="mt-8" size="lg">
                      Try again
                  </Button>
              </div>
          </main>
        </div>
      </body>
    </html>
  );
}

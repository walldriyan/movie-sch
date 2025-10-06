'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, AlertTriangle, RefreshCw } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ROLES } from '@/lib/permissions';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === ROLES.SUPER_ADMIN;

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-2xl">
        {isAdmin ? (
          <Card className="border-destructive">
            <CardHeader>
              <div className="flex items-center gap-4">
                 <AlertTriangle className="h-10 w-10 text-destructive" />
                 <div>
                    <CardTitle>Application Error</CardTitle>
                    <CardDescription>A runtime error occurred. The following information is available for debugging.</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>{error.name || 'Error'}</AlertTitle>
                <AlertDescription>
                  {error.message || 'An unknown error occurred.'}
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="mb-2 font-semibold">Stack Trace</h3>
                <div className="bg-muted p-4 rounded-md max-h-80 overflow-y-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                    <code>{error.stack || 'No stack trace available.'}</code>
                  </pre>
                </div>
              </div>

               {error.digest && (
                 <div>
                    <h3 className="mb-2 font-semibold">Digest</h3>
                    <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded-md">{error.digest}</p>
                 </div>
               )}
              
               <div className="flex justify-end">
                <Button onClick={() => reset()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
               </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center">
             <CardHeader>
              <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                <AlertTriangle className="h-10 w-10 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <h1 className="text-2xl font-bold font-serif">Oops! Something went wrong.</h1>
                <p className="text-muted-foreground">
                    We've encountered an unexpected issue. Please try again. If the problem persists, please contact support.
                </p>
                <Button onClick={() => reset()} size="lg" className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try again
                </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Film, AlertCircle, Loader2, Mail } from 'lucide-react';
import { doSignIn } from '@/lib/actions';
import { signIn as nextAuthSignIn } from 'next-auth/react';
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Google Icon Component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? 'Signing in...' : 'Sign in with Email'}
    </Button>
  );
}

function GoogleSignInButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await nextAuthSignIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Google sign-in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Connecting...' : 'Continue with Google'}
    </Button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction] = useActionState(doSignIn, { success: false, error: undefined });
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);

  // Check for OAuth errors
  const error = searchParams.get('error');
  const errorMessage = error === 'OAuthAccountNotLinked'
    ? 'This email is already registered with a different sign-in method.'
    : error
      ? 'An error occurred during sign-in. Please try again.'
      : undefined;

  // Effect to handle redirection on successful login
  useEffect(() => {
    if (state.success) {
      const callbackUrl = searchParams.get('callbackUrl') || '/';
      window.location.href = callbackUrl;
    }
  }, [state.success, searchParams]);

  // Check if Google OAuth is configured
  useEffect(() => {
    // Google auth is available if the provider is configured
    // We'll show it by default and let the backend handle if it's not configured
    setShowGoogleAuth(true);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2">
            <Film className="h-8 w-8 text-primary" />
            <span className="inline-block font-bold font-serif text-3xl">
              CineVerse
            </span>
          </Link>
          <p className="mt-2 text-muted-foreground">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        <Card>
          <form action={formAction}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>
                Choose your preferred sign-in method
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4">
              {/* Google Sign In */}
              {showGoogleAuth && (
                <>
                  <GoogleSignInButton />

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with email
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Email/Password Form */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>

              {/* Error Messages */}
              <div
                className="flex h-8 items-end space-x-1"
                aria-live="polite"
                aria-atomic="true"
              >
                {(state.error || errorMessage) && (
                  <>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm text-destructive">
                      {state.error || errorMessage}
                    </p>
                  </>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <LoginButton />
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-primary hover:underline"
                >
                  Create account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Terms and Privacy */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-primary">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate } from '@/lib/actions';
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
import Link from 'next/link';
import { Film, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [errorMessage, dispatch] = useActionState(authenticate, undefined);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2">
                <Film className="h-8 w-8 text-primary" />
                <span className="inline-block font-bold font-serif text-3xl">
                    CineVerse
                </span>
            </Link>
             <p className="mt-2 text-muted-foreground">Welcome back! Please sign in to your account.</p>
        </div>
        <Card>
          <form action={dispatch}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your email and password below to login
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                />
              </div>
              <div
                className="flex h-8 items-end space-x-1"
                aria-live="polite"
                aria-atomic="true"
              >
                {errorMessage && (
                  <>
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm text-destructive">{errorMessage}</p>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
               <LoginButton />
                <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link href="/register" className="font-semibold text-primary hover:underline">
                        Register
                    </Link>
                </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
 
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? 'Signing in...' : 'Login'}
    </Button>
  );
}

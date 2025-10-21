'use client';

import { useEffect, useState } from 'react';
import { useActionState, useFormStatus } from 'react-dom';
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
import { getSuperAdminEmailForDebug, registerUser } from '@/lib/actions';
import React from 'react';


export default function RegisterPage() {
  const [state, formAction] = useActionState(registerUser, { message: null });
  const [superAdminEmail, setSuperAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminEmail = async () => {
      const email = await getSuperAdminEmailForDebug();
      setSuperAdminEmail(email);
    };
    fetchAdminEmail();
  }, []);

  const isMatch = superAdminEmail && state?.input?.email === superAdminEmail;

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
             <p className="mt-2 text-muted-foreground">Create your account to get started.</p>
        </div>
        <Card>
          <form action={formAction}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Register</CardTitle>
              <CardDescription>
                Enter your details to create a new account
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                    id="name" 
                    name="name"
                    type="text" 
                    placeholder="John Doe" 
                    required 
                />
              </div>
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
               {state?.message && (
                  <div className="flex items-center space-x-2 text-destructive text-sm mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <p>{state.message}</p>
                  </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <RegisterButton />
              <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                      Login
                  </Link>
              </p>
            </CardFooter>
          </form>
        </Card>


      </div>
    </div>
  );
}


function RegisterButton() {
  const { pending } = useFormStatus();
 
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? 'Creating account...' : 'Register'}
    </Button>
  );
}

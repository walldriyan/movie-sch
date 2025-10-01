'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Film } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/',
      });
  
      if (result?.error) {
        // This is a workaround to get the full error object
        let errorObject;
        try {
          // Errors from next-auth are sometimes JSON strings
          errorObject = JSON.parse(result.error);
        } catch (e) {
          // Or just plain strings
          errorObject = { 
              message: result.error === 'CredentialsSignin' 
                ? 'Invalid email or password' 
                : result.error, 
              name: result.error, 
              stack: 'N/A' 
          };
        }

        setError(errorObject);

        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: errorObject.message,
        });
      } else if (result?.ok) {
        toast({
          title: 'Success',
          description: 'Login successful!',
        });
        router.push('/');
        router.refresh(); 
      } else {
        // Handle cases where result is null or not ok without an error
         const unknownError = { message: 'An unexpected error occurred during login.', name: 'UnknownError', stack: 'N/A' };
         setError(unknownError);
         toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: unknownError.message,
        });
      }
    } catch (error: any) {
      setError(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };


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
          <form onSubmit={handleCredentialsLogin}>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    name="password"
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
               <Button className="w-full" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </Button>
                <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link href="/register" className="font-semibold text-primary hover:underline">
                        Register
                    </Link>
                </p>
            </CardFooter>
          </form>
        </Card>
        {error && (
            <Card className="mt-4 bg-destructive/10 border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive text-lg">Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <pre className="text-sm text-destructive-foreground bg-transparent p-4 rounded-md overflow-auto">
                        {JSON.stringify({ message: error.message, name: error.name }, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}

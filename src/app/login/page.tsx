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

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.8 0-5.18-1.88-6.04-4.42H2.34v2.84C4.13 20.98 7.79 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.96 14.25c-.2-.6-.31-1.25-.31-1.92s.11-1.32.31-1.92V7.58H2.34C1.5 9.15 1 10.52 1 12s.5 2.85 1.34 4.42l3.62-2.77z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.79 1 4.13 3.02 2.34 5.96l3.62 2.77c.86-2.54 3.24-4.42 6.04-4.42z"
            fill="#EA4335"
        />
    </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const handleGoogleLogin = async () => {
    await signIn('google', { callbackUrl: '/' });
  };
  
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
        const errorMessage = result.error === 'CredentialsSignin' 
          ? 'Invalid email or password' 
          : result.error;
        
        setError({ message: errorMessage, stack: 'N/A', name: result.error });

        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: errorMessage,
        });
      } else if (result?.ok) {
        toast({
          title: 'Success',
          description: 'Login successful!',
        });
        router.push('/');
        router.refresh(); 
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
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
               <Button variant="outline" className="w-full" type="button" onClick={handleGoogleLogin}>
                    <GoogleIcon />
                    Login with Google
                </Button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                        </span>
                    </div>
                </div>
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
                        {JSON.stringify({ message: error.message, stack: error.stack, name: error.name, cause: error.cause }, null, 2)}
                    </pre>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}

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
import { useToast } from '@/hooks/use-toast';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State for debugging
  const [debugInfo, setDebugInfo] = useState<object | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDebugInfo(null);

    const submittedData = { name, email, password };
    let serverResponse = {};

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submittedData),
      });
      
      let responseBody;
      try {
        responseBody = await response.json();
      } catch (jsonError) {
        // If response is not JSON, read it as text
        responseBody = await response.text();
      }
      
      serverResponse = {
        status: response.status,
        statusText: response.statusText,
        body: responseBody,
      };

      if (!response.ok) {
        throw new Error(typeof responseBody === 'object' && responseBody.message ? responseBody.message : 'Registration failed');
      }

      // Automatically sign in the user after successful registration
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (signInResult?.ok) {
        toast({
          title: 'Registration Successful',
          description: 'Welcome to CineVerse!',
        });
        router.push('/');
      } else {
        throw new Error(signInResult?.error || 'Sign in after registration failed');
      }

    } catch (err: any) {
       setDebugInfo({
          step: 'Error caught',
          submittedData,
          serverResponse,
          error: {
            name: err.name,
            message: err.message,
            stack: err.stack
          },
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
             <p className="mt-2 text-muted-foreground">Create your account to get started.</p>
        </div>
        <Card>
          <form onSubmit={handleRegister}>
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
                    type="text" 
                    placeholder="John Doe" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
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
                {loading ? 'Creating account...' : 'Register'}
              </Button>
              <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                      Login
                  </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
        
        {/* Debug Information Box */}
        <Card className="mt-4 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div>
                <h4 className="font-bold">Live Input Data:</h4>
                <pre className="mt-1 p-2 bg-background rounded-md overflow-x-auto">
                  {JSON.stringify({ name, email, password: password.replace(/./g, '*') }, null, 2)}
                </pre>
              </div>
              {debugInfo && (
                <div>
                  <h4 className="font-bold mt-4">Last Action Trace:</h4>
                  <pre className="mt-1 p-2 bg-background rounded-md overflow-x-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

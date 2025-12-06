'use client';

import { useEffect, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, AlertCircle, Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { getSuperAdminEmailForDebug, registerUser } from '@/lib/actions';
import { signIn as nextAuthSignIn } from 'next-auth/react';
import React from 'react';

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

function RegisterButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium transition-all duration-300 shadow-lg shadow-purple-500/25"
      type="submit"
      disabled={pending}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? 'Creating account...' : 'Create Account'}
      {!pending && <ArrowRight className="ml-2 h-4 w-4" />}
    </Button>
  );
}

function GoogleSignUpButton() {
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
      className="w-full h-12 bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 rounded-xl text-white font-medium transition-all duration-300"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <GoogleIcon className="mr-2 h-5 w-5" />
      )}
      {isLoading ? 'Connecting...' : 'Sign up with Google'}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerUser, { message: null });
  const [showPassword, setShowPassword] = useState(false);
  const [superAdminEmail, setSuperAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminEmail = async () => {
      const email = await getSuperAdminEmailForDebug();
      setSuperAdminEmail(email);
    };
    fetchAdminEmail();
  }, []);

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Hero Background Image */}
        <div className="absolute inset-6 rounded-3xl overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80"
            alt="Cinema Experience"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-transparent" />

          {/* Content on Hero */}
          <div className="absolute bottom-12 left-12 right-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Join CineVerse Today
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Start Your<br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Movie Journey
              </span>
            </h1>
            <p className="text-white/60 text-lg max-w-md mb-6">
              Create your free account and unlock access to thousands of movies, exclusive content, and a vibrant community.
            </p>

            {/* Benefits */}
            <div className="space-y-3">
              {['Unlimited streaming', 'Personalized recommendations', 'Join movie discussions'].map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-white/70">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-white">CineVerse</span>
            </Link>
            <h2 className="text-3xl font-bold text-white mb-2">Create account</h2>
            <p className="text-white/50">Sign up to get started with CineVerse</p>
          </div>

          {/* Register Form */}
          <form action={formAction} className="space-y-5">
            {/* Social Sign Up */}
            <GoogleSignUpButton />

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-white/40">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/70">Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                  className="h-12 pl-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="h-12 pl-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="h-12 pl-12 pr-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-500/50 focus:bg-white/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-white/30">Must be at least 8 characters</p>
            </div>

            {/* Error Messages */}
            {state?.message && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">
                  {state.message}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <RegisterButton />

            {/* Sign In Link */}
            <p className="text-center text-white/50">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>

          {/* Terms & Privacy */}
          <p className="text-center text-xs text-white/30 mt-8">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-white/50 hover:text-white/70 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-white/50 hover:text-white/70 underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

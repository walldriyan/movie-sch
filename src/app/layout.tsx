
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Space_Grotesk, Noto_Sans_Sinhala } from 'next/font/google';
import { cn } from '@/lib/utils';
import Header from '@/components/header';
import React from 'react';
import SessionProvider from '@/components/auth/session-provider';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'CineVerse Captions',
  description: 'The universe of movies and subtitles at your fingertips.',
};

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontSerif = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'block', // Use 'block' to prevent layout shift
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
  preload: true,
});

const fontSinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  variable: '--font-sinhala',
  display: 'swap',
});

export function reportWebVitals(metric: any) {
  // console.log('[Performance Metric]', metric);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  console.log("Server [layout.tsx] Session from auth() on server:", JSON.stringify(session, null, 2));
  console.log("Current User Details (Layout):", session?.user);


  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body
        className={cn(
          'min-h-screen bg-[#0a0a0a] font-sans antialiased relative ',
          fontSans.variable,
          fontSerif.variable,
          fontSinhala.variable
        )}
      >
        <SessionProvider session={session}>
          <div className="absolute inset-0 pointer-events-none overflow-x-hidden" aria-hidden="true">
            <div className="absolute -top-1/4 left-0 w-[50rem] h-[50rem] rounded-full bg-yellow-950/90 filter blur-3xl opacity-5"></div>
            <div className="absolute -bottom-1/4 -right-1/4 w-[50rem] h-[50rem] rounded-full bg-blue-900/50 filter blur-3xl opacity-[0.08]"></div>
            <div className="absolute -bottom-1/2 left-1/4 w-[40rem] h-[40rem] rounded-full bg-green-900/50 filter blur-3xl opacity-[0.07]"></div>
          </div>
          
          <Header session={session} />
          <main className="pt-16">
            {children}
          </main>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}

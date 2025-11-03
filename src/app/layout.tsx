import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Space_Grotesk, Noto_Sans_Sinhala } from 'next/font/google';
import { cn } from '@/lib/utils';
import React from 'react';
import { LoadingProvider } from '@/context/loading-context';
import GlobalLoadingBar from '@/components/global-loading-bar';
import Navbar from '@/components/navigation/navbar';
import SessionProvider from '@/components/auth/session-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import ErrorBoundary from '@/components/error-boundary';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark overflow-x-hidden">
      <head>
        <title>CineVerse Captions</title>
        <meta name="description" content="The universe of movies and subtitles at your fingertips." />
      </head>
      <body
        className={cn(
          'min-h-screen bg-gradient-to-r from-zinc-950/60 via-stone-900/10 to-zinc-950/50  font-sans antialiased relative ',
          fontSans.variable,
          fontSerif.variable,
          fontSinhala.variable
        )}
      >
        <SessionProvider>
          <LoadingProvider>
            <SidebarProvider>
                <GlobalLoadingBar />
                <div className="absolute inset-0 pointer-events-none overflow-x-hidden" aria-hidden="true">
                  <div className="absolute -top-1/4 left-0 w-[50rem] h-[50rem] rounded-full bg-yellow-950/90 filter blur-3xl opacity-5"></div>
                  <div className="absolute -bottom-1/4 -right-1/4 w-[50rem] h-[50rem] rounded-full bg-blue-900/50 filter blur-3xl opacity-[0.08]"></div>
                  <div className="absolute -bottom-1/2 left-1/4 w-[40rem] h-[40rem] rounded-full bg-green-900/50 filter blur-3xl opacity-[0.07]"></div>
                </div>
                
                <Navbar />
                <main className="flex flex-col items-center pt-16">
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                </main>
                
                <Toaster />
            </SidebarProvider>
          </LoadingProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Space_Grotesk, Noto_Sans_Sinhala } from 'next/font/google';
import { cn } from '@/lib/utils';
import React from 'react';
import { LoadingProvider } from '@/context/loading-context';
import GlobalLoadingBar from '@/components/global-loading-bar';
import LeftSidebar from '@/components/navigation/left-sidebar';
import SessionProvider from '@/components/auth/session-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import ErrorBoundary from '@/components/error-boundary';
import { ConnectivityProvider } from '@/context/connectivity-context';
import { siteConfig } from '@/config/site.config';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontSerif = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'block',
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <title>{siteConfig.seo.title}</title>
        <meta name="description" content={siteConfig.seo.description} />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          'min-h-screen bg-background font-sans antialiased relative flex flex-col',
          fontSans.variable,
          fontSerif.variable,
          fontSinhala.variable
        )}
      >
        <SessionProvider>
          <LoadingProvider>
            <ConnectivityProvider>
              <SidebarProvider>
                <GlobalLoadingBar />

                {/* Suno-style Left Sidebar with dynamic width */}
                <LeftSidebar />

                {/* Main Content - padding controlled by sidebar */}
                <main className="flex-1">
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                </main>

                <Toaster />
              </SidebarProvider>
            </ConnectivityProvider>
          </LoadingProvider>
        </SessionProvider>
      </body>
    </html>
  );
}


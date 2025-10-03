import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Space_Grotesk, Noto_Sans_Sinhala } from 'next/font/google';
import { cn } from '@/lib/utils';
import SessionProvider from '@/components/auth/session-provider';
import Header from '@/components/header';

export const metadata: Metadata = {
  title: 'CineVerse Captions',
  description: 'The universe of movies and subtitles at your fingertips.',
};

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSerif = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-serif',
});

const fontSinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  variable: '--font-sinhala',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          'min-h-screen bg-[#0a0a0a] font-sans antialiased relative overflow-x-hidden',
          fontSans.variable,
          fontSerif.variable,
          fontSinhala.variable
        )}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-1/4 left-0 w-[50rem] h-[50rem] rounded-full bg-yellow-950/50 filter blur-3xl opacity-5"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-[50rem] h-[50rem] rounded-full bg-blue-900/50 filter blur-3xl opacity-[0.08]"></div>
          <div className="absolute -bottom-1/2 left-1/4 w-[40rem] h-[40rem] rounded-full bg-green-900/50 filter blur-3xl opacity-[0.07]"></div>
        </div>

        <SessionProvider>
          <Header />
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}

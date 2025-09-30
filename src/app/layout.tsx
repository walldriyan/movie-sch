import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Inter, Space_Grotesk, Noto_Sans_Sinhala } from 'next/font/google';
import { cn } from '@/lib/utils';

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
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontSerif.variable,
          fontSinhala.variable
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

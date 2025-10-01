import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="w-full bg-background text-foreground">
        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-8 text-center mt-16">
            <div className="max-w-md">
                <h1 className="text-9xl font-bold text-primary">404</h1>
                <h2 className="mt-4 font-serif text-3xl font-bold">Page Not Found</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Sorry, we couldn’t find the page you’re looking for.
                </p>
                <Button asChild className="mt-8" size="lg">
                    <Link href="/">Go back home</Link>
                </Button>
            </div>
        </main>
    </div>
  );
}

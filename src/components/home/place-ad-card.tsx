'use client';

import { Button } from '@/components/ui/button';
import { Megaphone, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function PlaceAdCard({ className }: { className?: string }) {
    const { data: session } = useSession();
    const router = useRouter();

    const handleClick = () => {
        if (!session?.user) {
            // Redirect to login or show alert
            router.push('/login');
        } else {
            // Redirect to profile ads section with create action
            router.push(`/profile/${session.user.id}?filter=ads&action=create`);
        }
    };

    return (
        <div
            className={cn(
                "relative overflow-hidden cursor-pointer group border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/50 transition-all duration-300 h-full flex flex-col items-center justify-center text-center p-6 rounded-xl min-h-[300px]",
                className
            )}
            onClick={handleClick}
        >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                <Megaphone className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Promote Your Content</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-[200px]">
                Reach thousands of users by placing your ad here.
            </p>
            <Button variant="outline" className="rounded-full border-primary/30 hover:bg-primary hover:text-white group-hover:border-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Ad
            </Button>
        </div>
    );
}

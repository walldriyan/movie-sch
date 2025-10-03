'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Film, RefreshCw, Users, Inbox } from 'lucide-react';
import AuthGuard from '@/components/auth/auth-guard';
import { ROLES } from '@/lib/permissions';
import { getPendingApprovals } from '@/lib/actions';
import type { Movie, User } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

type PendingMovie = Pick<Movie, 'id' | 'title'> & { author: Pick<User, 'name'> };
type PendingUser = Pick<User, 'id' | 'name' | 'email'>;

interface ApprovalsState {
  pendingMovies: PendingMovie[];
  pendingUsers: PendingUser[];
}

export default function HeaderApprovals() {
  const [approvals, setApprovals] = useState<ApprovalsState | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchApprovals = () => {
    startTransition(async () => {
      try {
        const data = await getPendingApprovals();
        setApprovals(data as any);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch approvals.',
        });
      }
    });
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const totalApprovals = (approvals?.pendingMovies.length || 0) + (approvals?.pendingUsers.length || 0);

  const renderContent = () => {
    if (isPending && !approvals) {
      return (
        <div className="p-2 space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }
    
    if (totalApprovals === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold">All Caught Up</h3>
                <p className="text-sm text-muted-foreground">There are no pending approvals.</p>
            </div>
        )
    }

    return (
        <ScrollArea className="max-h-96">
            {approvals?.pendingMovies.length > 0 && (
                <>
                    <DropdownMenuLabel className="flex items-center gap-2"><Film /> Pending Movies</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {approvals.pendingMovies.map(movie => (
                        <DropdownMenuItem key={`movie-${movie.id}`} asChild>
                            <Link href="/manage" className="flex-col items-start">
                                <div className="font-semibold">{movie.title}</div>
                                <div className="text-xs text-muted-foreground">by {movie.author.name}</div>
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </>
            )}
             {approvals?.pendingUsers.length > 0 && (
                <>
                    <DropdownMenuLabel className="flex items-center gap-2 pt-4"><Users /> Pending Users</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {approvals.pendingUsers.map(user => (
                        <DropdownMenuItem key={`user-${user.id}`} asChild>
                            <Link href="/admin/users" className="flex-col items-start">
                                 <div className="font-semibold">{user.name}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </>
            )}
        </ScrollArea>
    )
  };

  return (
    <AuthGuard requiredRole={ROLES.SUPER_ADMIN}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell />
            {totalApprovals > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{totalApprovals}</Badge>
            )}
            <span className="sr-only">Toggle approvals</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-2">
                 <DropdownMenuLabel className="p-0">Approvals</DropdownMenuLabel>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchApprovals} disabled={isPending}>
                    <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            <DropdownMenuSeparator />
            {renderContent()}
        </DropdownMenuContent>
      </DropdownMenu>
    </AuthGuard>
  );
}

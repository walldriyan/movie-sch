

'use server';

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
import { Bell, Film, RefreshCw, Users, Inbox, ExternalLink } from 'lucide-react';
import AuthGuard from '@/components/auth/auth-guard';
import { ROLES } from '@/lib/permissions';
import { getPendingApprovals } from '@/lib/actions';
import type { Post, User } from '@prisma/client';
import { ScrollArea } from './ui/scroll-area';
import { revalidatePath } from 'next/cache';

type PendingPost = Pick<Post, 'id' | 'title'> & { author: Pick<User, 'name'> | null };
type PendingUser = Pick<User, 'id' | 'name' | 'email'>;

interface ApprovalsState {
  pendingPosts: PendingPost[];
  pendingUsers: PendingUser[];
}

const renderContent = (approvals: ApprovalsState | null) => {
    if (!approvals) {
      return (
        <div className="p-2 space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }
    
    const safePendingPosts = approvals.pendingPosts?.filter(p => p) || [];
    const safePendingUsers = approvals.pendingUsers?.filter(u => u) || [];
    const totalApprovals = safePendingPosts.length + safePendingUsers.length;

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
            {safePendingPosts.length > 0 && (
                <>
                    <DropdownMenuLabel className="flex items-center gap-2"><Film /> Pending Posts</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {safePendingPosts.map(post => (
                        <DropdownMenuItem key={`movie-${post.id}`} className="flex-col items-start focus:bg-transparent">
                            <div>
                                <div className="font-semibold">{post.title}</div>
                                <div className="text-xs text-muted-foreground">by {post.author?.name || 'Unknown'}</div>
                            </div>
                             <div className="flex items-center gap-2 mt-2">
                                <Button asChild size="sm" variant="outline">
                                    <Link href={`/movies/${post.id}`}>Read</Link>
                                </Button>
                                <Button asChild size="sm" variant="secondary">
                                    <Link href="/manage">Manage</Link>
                                </Button>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </>
            )}
             {safePendingUsers.length > 0 && (
                <>
                    <DropdownMenuLabel className="flex items-center gap-2 pt-4"><Users /> Pending Users</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {safePendingUsers.map(user => (
                        <DropdownMenuItem key={`user-${user.id}`} asChild>
                            <Link href="/admin/users" className="flex-col items-start">
                                 <div className="font-semibold">{user.name || 'Unknown User'}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </>
            )}
        </ScrollArea>
    )
  };

export default async function HeaderApprovals() {
  const approvals = await getPendingApprovals() as ApprovalsState;
  const totalApprovals = (approvals?.pendingPosts?.length || 0) + (approvals?.pendingUsers?.length || 0);

  async function refreshApprovalsAction() {
    'use server'
    revalidatePath('/')
  }

  return (
    <AuthGuard requiredRole={ROLES.SUPER_ADMIN || ROLES.USER_ADMIN}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell />
            {totalApprovals > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{totalApprovals}</Badge>
            )}
            <span className="sr-only">Toggle approvals</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
            <form action={refreshApprovalsAction} className="flex items-center justify-between p-2">
                 <DropdownMenuLabel className="p-0">Approvals</DropdownMenuLabel>
                <Button variant="ghost" size="icon" className="h-7 w-7" type="submit">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </form>
            <DropdownMenuSeparator />
            {renderContent(approvals)}
        </DropdownMenuContent>
      </DropdownMenu>
    </AuthGuard>
  );
}



// @ts-nocheck
'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
import { Bell, Film, Users, Inbox, RefreshCw, Loader2, MessageSquareWarning } from 'lucide-react';
import AuthGuard from '@/components/auth/auth-guard';
import { ROLES } from '@/lib/permissions';
import { getDashboardNotifications } from '@/lib/actions';
import type { Post, User } from '@prisma/client';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

type PendingPost = Pick<Post, 'id' | 'title'> & { author: Pick<User, 'name'> | null };
type PendingUser = Pick<User, 'id' | 'name' | 'email'>;
type UnreadFeedback = { id: string, title: string, user: { name: string | null } };

interface NotificationsState {
  pendingPosts: PendingPost[];
  pendingUsers: PendingUser[];
  unreadFeedback: UnreadFeedback[];
}

const renderContent = (notifications: NotificationsState | null) => {
  if (!notifications) return null;

  const { pendingPosts, pendingUsers, unreadFeedback } = notifications;
  const totalNotifications = pendingPosts.length + pendingUsers.length + unreadFeedback.length;

  if (totalNotifications === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold">All Caught Up</h3>
        <p className="text-sm text-muted-foreground">There are no pending items.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="max-h-96">
      {pendingPosts.length > 0 && (
        <>
          <DropdownMenuLabel className="flex items-center gap-2">
            <Film /> Pending Posts
            <Badge variant="secondary" className="ml-auto">{pendingPosts.length}</Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {pendingPosts.map(post => (
            <DropdownMenuItem key={`post-${post.id}`} asChild>
              <Link href={`/movies/${post.id}`} className="flex-col items-start focus:bg-transparent">
                <div>
                  <div className="font-semibold">{post.title}</div>
                  <div className="text-xs text-muted-foreground">by {post.author?.name || 'Unknown'}</div>
                </div>
              </Link>
            </DropdownMenuItem>
          ))}
        </>
      )}
      {pendingUsers.length > 0 && (
        <>
          <DropdownMenuLabel className="flex items-center gap-2 pt-4">
            <Users /> Pending Users
            <Badge variant="secondary" className="ml-auto">{pendingUsers.length}</Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {pendingUsers.map(user => (
            <DropdownMenuItem key={`user-${user.id}`} asChild>
              <Link href="/admin/users" className="flex-col items-start">
                <div className="font-semibold">{user.name || 'Unknown User'}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </Link>
            </DropdownMenuItem>
          ))}
        </>
      )}
      {unreadFeedback.length > 0 && (
        <>
          <DropdownMenuLabel className="flex items-center gap-2 pt-4">
            <MessageSquareWarning /> New Feedback
            <Badge variant="secondary" className="ml-auto">{unreadFeedback.length}</Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {unreadFeedback.map(fb => (
            <DropdownMenuItem key={`fb-${fb.id}`} asChild>
              <Link href="/admin/feedback" className="flex-col items-start">
                <div className="font-semibold truncate">{fb.title}</div>
                <div className="text-xs text-muted-foreground">from {fb.user.name || 'Anonymous'}</div>
              </Link>
            </DropdownMenuItem>
          ))}
        </>
      )}
    </ScrollArea>
  )
};

export default function HeaderApprovals() {
  const [notifications, setNotifications] = useState<NotificationsState | null>(null);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardNotifications() as NotificationsState;
      setNotifications(data);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch notifications.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    startRefreshTransition(async () => {
      await fetchNotifications();
      toast({
        title: 'Refreshed',
        description: 'Notification list has been updated.',
      });
    });
  }

  const totalNotifications = (notifications?.pendingPosts?.length || 0) + (notifications?.pendingUsers?.length || 0) + (notifications?.unreadFeedback?.length || 0);

  return (
    <AuthGuard requiredRole={ROLES.SUPER_ADMIN || ROLES.USER_ADMIN}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell />
            {totalNotifications > 0 && !isLoading && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{totalNotifications}</Badge>
            )}
            {isLoading && (
              <Loader2 className="absolute -top-1 -right-1 h-5 w-5 animate-spin" />
            )}
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between p-2">
            <DropdownMenuLabel className="p-0">Dashboard Notifications</DropdownMenuLabel>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <DropdownMenuSeparator />
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            renderContent(notifications)
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </AuthGuard>
  );
}

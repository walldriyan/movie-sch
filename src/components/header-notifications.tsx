

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
import { Bell, Film, RefreshCw, Users, Inbox, ExternalLink } from 'lucide-react';
import { getNotificationsForUser, markNotificationAsRead } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import ClientRelativeDate from './client-relative-date';
import { useRouter } from 'next/navigation';

export default function HeaderNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const fetchNotifications = () => {
    startTransition(async () => {
      try {
        const data = await getNotificationsForUser({ isRead: false });
        setNotifications(data.notifications);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not fetch notifications.',
        });
        setNotifications([]);
      }
    });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = async (userNotification: any) => {
    // Optimistically mark as read
    setNotifications(currentNotifications => 
      currentNotifications.map(n => 
        n.id === userNotification.id ? { ...n, isRead: true } : n
      )
    );
    router.push('/notifications');
    await markNotificationAsRead(userNotification.id);
  };
  
  const renderContent = () => {
    if (isPending && notifications.length === 0) {
      return (
        <div className="p-2 space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      );
    }
    
    const unreadNotifications = notifications.filter(n => !n.isRead);

    if (unreadNotifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold">All Caught Up</h3>
                <p className="text-sm text-muted-foreground">You have no new notifications.</p>
            </div>
        )
    }

    return (
        <ScrollArea className="max-h-96">
            {unreadNotifications.map(userNotification => (
                <DropdownMenuItem 
                    key={userNotification.id} 
                    className="flex-col items-start focus:bg-gray-800"
                    onSelect={() => handleNotificationClick(userNotification)}
                >
                    <div className="flex items-start gap-3 w-full">
                        <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src={userNotification.notification.author.image || ''} alt={userNotification.notification.author.name} />
                            <AvatarFallback>{userNotification.notification.author.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow">
                            <p className="font-semibold text-sm">{userNotification.notification.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: userNotification.notification.message }} />
                             <ClientRelativeDate date={userNotification.notification.createdAt} />
                        </div>
                    </div>
                </DropdownMenuItem>
            ))}
        </ScrollArea>
    )
  };

  return (
      <DropdownMenu onOpenChange={(open) => open && fetchNotifications()}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell />
            {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
            )}
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-2">
                 <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchNotifications} disabled={isPending}>
                    <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            <DropdownMenuSeparator />
            {renderContent()}
            <DropdownMenuSeparator />
             <DropdownMenuItem asChild>
                <Link href="/notifications" className="justify-center">
                    View all notifications
                </Link>
             </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}

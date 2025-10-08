
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getNotificationsForUser, markNotificationAsRead } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Inbox, Loader2 } from 'lucide-react';
import ClientRelativeDate from '@/components/client-relative-date';
import type { Notification } from '@prisma/client';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from '@/hooks/useCurrentUser';

type NotificationWithDetails = Notification & {
  author: { name: string; image: string | null };
};

type UserNotification = {
  id: number;
  isRead: boolean;
  notification: NotificationWithDetails;
}

const NOTIFICATIONS_PER_PAGE = 10;

const NotificationList = ({ notifications, onNotificationClick, loading, loaderRef }: { notifications: UserNotification[], onNotificationClick: (id: number) => void, loading: boolean, loaderRef: React.Ref<HTMLDivElement> | null }) => {
  if (notifications.length === 0 && !loading) {
    return (
       <Card className="text-center border-dashed mt-8">
        <CardContent className="p-16 flex flex-col items-center gap-4">
            <Inbox className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
                All Caught Up!
            </h3>
            <p className="text-muted-foreground">
                You have no notifications here.
            </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <Accordion type="multiple" className="w-full space-y-2">
        {notifications.map((userNotification) => (
          <AccordionItem
            value={`item-${userNotification.id}`}
            key={userNotification.id}
            className="bg-card/50 rounded-lg border px-4"
            onClick={() => onNotificationClick(userNotification.id)}
          >
            <AccordionTrigger>
              <div className="flex items-start gap-4 text-left">
                <Avatar className="mt-1">
                  <AvatarImage src={userNotification.notification.author?.image || undefined} />
                  <AvatarFallback>{userNotification.notification.author?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-medium text-base">{userNotification.notification.title}</p>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <p>by {userNotification.notification.author.name}</p>
                    <span>&middot;</span>
                    <ClientRelativeDate date={userNotification.notification.createdAt} />
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div
                className="prose prose-sm prose-invert text-muted-foreground max-w-none p-4 bg-muted/50 rounded-lg"
                dangerouslySetInnerHTML={{ __html: userNotification.notification.message }}
              ></div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div ref={loaderRef} className="flex justify-center py-4">
        {loading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
      </div>
    </div>
  );
};


export default function NotificationsPage() {
  const user = useCurrentUser();

  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const [unreadNotifications, setUnreadNotifications] = useState<UserNotification[]>([]);
  const [readNotifications, setReadNotifications] = useState<UserNotification[]>([]);
  const [unreadPage, setUnreadPage] = useState(1);
  const [readPage, setReadPage] = useState(1);
  const [hasMoreUnread, setHasMoreUnread] = useState(true);
  const [hasMoreRead, setHasMoreRead] = useState(true);
  const [loading, setLoading] = useState(true);

  const observer = useRef<IntersectionObserver>();
  const loaderRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (activeTab === 'unread' && hasMoreUnread) {
          setUnreadPage(prev => prev + 1);
        } else if (activeTab === 'read' && hasMoreRead) {
          setReadPage(prev => prev + 1);
        }
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMoreUnread, hasMoreRead, activeTab]);

  const fetchNotifications = async (tab: 'unread' | 'read', page: number) => {
    setLoading(true);
    const isRead = tab === 'read';
    const { notifications, hasMore } = await getNotificationsForUser({ page, limit: NOTIFICATIONS_PER_PAGE, isRead });

    if (isRead) {
      setReadNotifications(prev => page === 1 ? notifications : [...prev, ...notifications]);
      setHasMoreRead(hasMore);
    } else {
      setUnreadNotifications(prev => page === 1 ? notifications : [...prev, ...notifications]);
      setHasMoreUnread(hasMore);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
        redirect('/login');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'unread') {
      if (unreadPage === 1 || hasMoreUnread) fetchNotifications('unread', unreadPage);
    } else {
      if (readPage === 1 || hasMoreRead) fetchNotifications('read', readPage);
    }
  }, [unreadPage, readPage, activeTab]);
  
  const handleTabChange = (value: string) => {
    const newTab = value as 'unread' | 'read';
    setActiveTab(newTab);
    if (newTab === 'read' && readNotifications.length === 0) {
      setReadPage(1);
      fetchNotifications('read', 1);
    }
  };

  const handleNotificationClick = async (userNotificationId: number) => {
    const clickedNotification = unreadNotifications.find(n => n.id === userNotificationId);
    if (clickedNotification && !clickedNotification.isRead) {
      setUnreadNotifications(prev => prev.filter(n => n.id !== userNotificationId));
      setReadNotifications(prev => [clickedNotification, ...prev].sort((a,b) => new Date(b.notification.createdAt).getTime() - new Date(a.notification.createdAt).getTime()));
      await markNotificationAsRead(userNotificationId);
    }
  };

  if (!user) {
    return null; // Or a loading skeleton
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-serif">Notifications</h1>
          <p className="text-muted-foreground">
            Here are the latest updates for you.
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
        <TabsContent value="unread">
          <NotificationList 
              notifications={unreadNotifications} 
              onNotificationClick={handleNotificationClick} 
              loading={loading && unreadNotifications.length === 0} 
              loaderRef={loaderRef} 
          />
        </TabsContent>
        <TabsContent value="read">
          <NotificationList 
              notifications={readNotifications} 
              onNotificationClick={() => {}} 
              loading={loading && readNotifications.length === 0} 
              loaderRef={loaderRef} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

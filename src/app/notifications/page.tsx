

'use server';

import { auth } from '@/auth';
import { getNotificationsForUser, markNotificationAsRead } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Inbox } from 'lucide-react';
import ClientRelativeDate from '@/components/client-relative-date';
import type { Notification } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type NotificationWithDetails = Notification & {
  author: { name: string, image: string | null };
};

export default async function NotificationsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect('/login');
  }

  const userNotifications = await getNotificationsForUser();
  const notifications = userNotifications.map(un => un.notification) as NotificationWithDetails[];

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
      
      {notifications.length > 0 ? (
        <div className="space-y-4">
          <Accordion type="multiple" className="w-full space-y-2">
            {notifications.map((notification, index) => (
              <AccordionItem value={`item-${index}`} key={notification.id} className="bg-card/50 rounded-lg border px-4">
                 <AccordionTrigger>
                    <div className="flex items-start gap-4 text-left">
                      <Avatar className="mt-1">
                          <AvatarImage src={notification.author?.image || undefined} />
                          <AvatarFallback>{notification.author?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <p className="font-medium text-base">{notification.title}</p>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <p>by {notification.author.name}</p>
                          <span>&middot;</span>
                          <ClientRelativeDate date={notification.createdAt} />
                        </div>
                      </div>
                    </div>
                 </AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm prose-invert text-muted-foreground max-w-none p-4 bg-muted/50 rounded-lg"
                       dangerouslySetInnerHTML={{ __html: notification.message }}
                  >
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ) : (
        <Card className="text-center border-dashed">
            <CardContent className="p-16 flex flex-col items-center gap-4">
                <Inbox className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-lg font-semibold">
                    All Caught Up!
                </h3>
                <p className="text-muted-foreground">
                    You have no new notifications.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}



'use server';

import { auth } from '@/auth';
import { getNotificationsForUser } from '@/lib/actions';
import { redirect } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Inbox } from 'lucide-react';
import ClientRelativeDate from '@/components/client-relative-date';
import { Badge } from '@/components/ui/badge';
import type { Post } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from '@/components/ui/card';

type GroupedNotifications = {
  [key: string]: Post[];
};

export default async function NotificationsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect('/login');
  }

  const notifications = await getNotificationsForUser();

  const groupedNotifications = notifications.reduce((acc: GroupedNotifications, notification) => {
    const groupName = notification.group?.name || 'General';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(notification as any);
    return acc;
  }, {});

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
        <div className="space-y-8">
          {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => (
            <div key={groupName}>
              <h2 className="font-semibold text-lg text-muted-foreground mb-4">{groupName}</h2>
              <div className="border-l-2 border-border pl-6 space-y-8">
                  {groupNotifications.map((notification, index) => (
                      <div key={notification.id} className="relative">
                          <div className="absolute -left-[33px] top-1.5 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                          
                          <Accordion type="single" collapsible>
                              <AccordionItem value={`item-${notification.id}`} className="border-b-0">
                                  <AccordionTrigger className="flex items-start gap-4 text-left hover:no-underline py-0">
                                      <Avatar className="mt-1">
                                          <AvatarImage src={notification.author.image || undefined} />
                                          <AvatarFallback>{notification.author.name?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-grow">
                                        <p className="font-medium text-base">{notification.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                          by {notification.author.name}
                                        </p>
                                      </div>
                                      <ClientRelativeDate date={notification.createdAt} />
                                  </AccordionTrigger>
                                  <AccordionContent className="pt-4 ml-16">
                                      <div className="prose prose-sm prose-invert text-muted-foreground max-w-none p-4 bg-muted/50 rounded-lg"
                                          dangerouslySetInnerHTML={{ __html: notification.description }}
                                      />
                                  </AccordionContent>
                              </AccordionItem>
                          </Accordion>
                      </div>
                  ))}
              </div>
            </div>
          ))}
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

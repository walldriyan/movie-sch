
'use server';

import { auth } from '@/auth';
import { getNotificationsForUser } from '@/lib/actions';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Bell, Inbox } from 'lucide-react';
import ClientRelativeDate from '@/components/client-relative-date';
import { Badge } from '@/components/ui/badge';

export default async function NotificationsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect('/login');
  }

  const notifications = await getNotificationsForUser();

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
        <div className="space-y-6">
          {notifications.map((notification) => (
            <Card key={notification.id} className="overflow-hidden">
              <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <Avatar>
                    <AvatarImage src={notification.author.image || undefined} />
                    <AvatarFallback>{notification.author.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                <div className="flex-grow">
                  <CardTitle className="text-lg">{notification.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                     <span>by {notification.author.name}</span>
                     <span className="text-xs">&middot;</span>
                     <ClientRelativeDate date={notification.createdAt} />
                  </CardDescription>
                </div>
                 {notification.group && (
                  <Badge variant="secondary">{notification.group.name}</Badge>
                 )}
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm prose-invert text-muted-foreground max-w-none"
                    dangerouslySetInnerHTML={{ __html: notification.description }}
                />
              </CardContent>
            </Card>
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

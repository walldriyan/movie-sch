
'use client';

import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuillEditor from '@/components/quill-editor';
import { Loader2, AlertCircle, Send, Bell } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Group } from '@prisma/client';
import { getGroups, sendNotification } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

const notificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(10, 'Message is required'),
  groupId: z.coerce.number().optional(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function SendNotificationPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchGroups() {
      const groupData = await getGroups();
      setGroups(groupData as any);
    }
    fetchGroups();
  }, []);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
    },
  });

  const { formState } = form;

  const handleSubmit = async (values: NotificationFormValues) => {
    setFormError(null);
    try {
      await sendNotification({
        title: values.title,
        message: values.message,
        groupId: values.groupId,
      });
      
      toast({
        title: 'Notification Sent!',
        description: 'Your notification has been sent to the selected group.',
      });
      
      form.reset();
      
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      setFormError(error.message || 'An unknown error occurred while sending the notification.');
    }
  };

  return (
    <div className="space-y-4">
       <div className="flex items-center gap-4 mb-8">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">
            Send Group Notification
          </h1>
          <p className="text-muted-foreground">This message will be sent directly to the selected group members.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Important Update"
                        {...field}
                        className="bg-transparent border-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <QuillEditor {...field} />
                    </FormControl>
                     <FormDescription>This is the main content of your notification.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Group (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={String(field.value || '')}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group to notify" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ALL_USERS">All Users</SelectItem>
                        {groups.length > 0 ? groups.map(group => (
                          <SelectItem key={group.id} value={String(group.id)}>{group.name}</SelectItem>
                        )) : <p className="p-2 text-xs text-muted-foreground">Loading groups...</p>}
                      </SelectContent>
                    </Select>
                     <FormDescription>If no group is selected, the notification will be sent to all users.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {formError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Submission Error</AlertTitle>
                  <AlertDescription>
                    {formError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={formState.isSubmitting}>
                  {formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                       Send Notification
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

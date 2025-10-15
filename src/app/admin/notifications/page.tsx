
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getGroupsForForm, getUsers, sendNotification } from '@/lib/actions';
import type { User, Group, NotificationTargetType } from '@prisma/client';
import { Loader2, Send, Users, User as UserIcon, Globe, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ROLES } from '@/lib/permissions';

const notificationSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
  targetType: z.enum(['USER', 'GROUP']),
  targetId: z.string().optional(),
}).superRefine((data, ctx) => {
    if ((data.targetType === 'USER' || data.targetType === 'GROUP') && !data.targetId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please select a target.',
            path: ['targetId'],
        });
    }
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

const roles = Object.values(ROLES);

function ComboboxSelector({ field, items, placeholder, notFoundText }: { field: any, items: any[], placeholder: string, notFoundText: string }) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormControl>
                    <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                        )}
                    >
                        {field.value
                        ? items.find((item) => item.id === field.value)?.name
                        : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>{notFoundText}</CommandEmpty>
                        <CommandGroup>
                        {items.map((item) => (
                            <CommandItem
                                value={item.name}
                                key={item.id}
                                onSelect={() => {
                                    field.onChange(item.id);
                                    setOpen(false);
                                }}
                            >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    item.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                            />
                            {item.name}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}


export default function NotificationsPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Pick<Group, "id" | "name">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, startSubmitting] = useTransition();

  useEffect(() => {
    async function fetchData() {
        try {
            const [usersData, groupsData] = await Promise.all([
                getUsers(),
                getGroupsForForm(),
            ]);
            setUsers(usersData);
            setGroups(groupsData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load users and groups.'})
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);
  

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
      targetType: 'USER',
    },
  });

  const targetType = form.watch('targetType');

  // Reset targetId when targetType changes
  useEffect(() => {
    form.resetField('targetId');
  }, [targetType, form]);

  const onSubmit = (values: NotificationFormValues) => {
    console.log('--- [Client] Data being sent to server action ---', values);

    startSubmitting(async () => {
        try {
            const result = await sendNotification({
                title: values.title,
                message: values.message,
                type: values.targetType,
                targetId: values.targetId || null,
            });
            console.log('--- [Server Action] Response from sendNotification ---', result);
            toast({
                title: "Notification Sent",
                description: "Your notification has been successfully sent and saved.",
            });
            form.reset();
        } catch (error) {
            console.error("--- [Notification Send Error] ---", error);
            toast({
                variant: 'destructive',
                title: 'Failed to Send',
                description: 'There was an error sending the notification. Please check the console.'
            });
        }
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-semibold text-lg md:text-2xl">Send Notification</h1>
      <Card>
        <CardHeader>
          <CardTitle>Compose Notification</CardTitle>
          <CardDescription>
            Craft and send a notification to your users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., System Maintenance" {...field} />
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
                      <Textarea
                        placeholder="e.g., We'll be undergoing maintenance..."
                        className="resize-y"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="targetType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a target audience" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="USER"><div className="flex items-center gap-2"><UserIcon className="h-4 w-4"/> Specific User</div></SelectItem>
                            <SelectItem value="GROUP"><div className="flex items-center gap-2"><Users className="h-4 w-4"/> Group</div></SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                {targetType === 'USER' && (
                    <FormField
                        control={form.control}
                        name="targetId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                                <FormLabel>Select User</FormLabel>
                                <ComboboxSelector field={field} items={users} placeholder="Select a user..." notFoundText="No user found." />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {targetType === 'GROUP' && (
                    <FormField
                        control={form.control}
                        name="targetId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col justify-end">
                                <FormLabel>Select Group</FormLabel>
                                <ComboboxSelector field={field} items={groups} placeholder="Select a group..." notFoundText="No group found." />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || isLoading}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

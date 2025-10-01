'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { requestAdminAccess } from '@/lib/actions';
import type { User } from '@prisma/client';
import { ShieldQuestion } from 'lucide-react';

const requestFormSchema = z.object({
  message: z.string().min(10, 'Please provide a brief reason for your request (at least 10 characters).').max(500),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

interface RequestAccessDialogProps {
  user: User;
}

export default function RequestAccessDialog({ user }: RequestAccessDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (data: RequestFormValues) => {
    try {
      await requestAdminAccess(user.id, data.message);
      
      toast({
        title: 'Request Sent',
        description: 'Your request for admin access has been sent for review.',
      });
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send request.',
      });
    }
  };

  const isRequestSent = user.permissionRequestStatus === 'PENDING' || user.permissionRequestStatus === 'APPROVED';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={isRequestSent}>
          <ShieldQuestion className="mr-2 h-4 w-4" />
          {isRequestSent ? 'Request Already Sent' : 'Request Admin Access'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Admin Access</DialogTitle>
          <DialogDescription>
            Please explain why you would like to become a contributor with admin privileges.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for request</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., I would like to help by adding and correcting movie information..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Sending...' : 'Send Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


'use client';

import { useEffect, useTransition } from 'react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateSetting, getSetting } from '@/lib/actions/settings';
import { Loader2, Settings as SettingsIcon, FileText, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const settingsSchema = z.object({
  dailyPostLimit: z.coerce.number().min(0, 'Limit must be 0 or more. 0 for unlimited.').default(10),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [isSubmitting, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      dailyPostLimit: 10,
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const dailyPostLimit = await getSetting('dailyPostLimit_default');
        if (dailyPostLimit) {
          form.setValue('dailyPostLimit', Number(dailyPostLimit.value));
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching settings',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, [form, toast]);


  const onSubmit = (data: SettingsFormValues) => {
    startTransition(async () => {
      try {
        await updateSetting('dailyPostLimit_default', String(data.dailyPostLimit));
        toast({
          title: 'Settings Updated',
          description: 'Your changes have been saved successfully.',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error.message || 'Could not save settings.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-semibold text-lg md:text-2xl flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        Application Settings
      </h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content & Post Limits
              </CardTitle>
              <CardDescription>
                Manage limits for content creation across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                 <div className="space-y-2">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-10 w-1/2" />
                 </div>
              ) : (
                <FormField
                  control={form.control}
                  name="dailyPostLimit"
                  render={({ field }) => (
                    <FormItem className="max-w-sm">
                      <FormLabel>Default Daily Post Limit</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Settings
              </CardTitle>
              <CardDescription>
                Settings related to user account types and permissions will appear here.
              </CardDescription>
            </CardHeader>
             <CardContent>
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
                <p>Coming soon...</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

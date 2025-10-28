
'use client';

import { useEffect, useTransition, useState, useMemo } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { updateSetting, getSetting, getGroupsForForm } from '@/lib/actions';
import { Loader2, Settings as SettingsIcon, FileText, Users, ChevronsUpDown, Check, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Group } from '@prisma/client';

const settingsSchema = z.object({
  dailyPostLimit: z.coerce.number().min(0, 'Limit must be 0 or more. 0 for unlimited.').default(10),
  microPostGroupIds: z.array(z.string()).optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

function MultiSelectGroups({
  allGroups,
  selectedGroupIds,
  onSelectionChange,
}: {
  allGroups: Pick<Group, 'id' | 'name'>[];
  selectedGroupIds: string[];
  onSelectionChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedGroups = useMemo(() => allGroups.filter(g => selectedGroupIds.includes(g.id)), [allGroups, selectedGroupIds]);

  const handleSelect = (groupId: string) => {
    onSelectionChange([...selectedGroupIds, groupId]);
    setOpen(false);
  };
  
  const handleUnselect = (groupId: string) => {
    onSelectionChange(selectedGroupIds.filter(id => id !== groupId));
  };
  
  const unselectedGroups = allGroups.filter(g => !selectedGroupIds.includes(g.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
        <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-10">
            <div className="flex flex-wrap gap-1">
                {selectedGroups.map((group) => (
                    <Badge key={group.id} variant="secondary">
                        {group.name}
                        <button
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onClick={() => handleUnselect(group.id)}
                        >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                    </Badge>
                ))}
                 <PopoverTrigger asChild>
                    <div role="combobox" aria-expanded={open} className="flex-grow">
                         <p className="text-sm text-muted-foreground">{selectedGroups.length === 0 && "Select groups..."}</p>
                    </div>
                </PopoverTrigger>
            </div>
        </div>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search groups..." />
          <CommandList>
            <CommandEmpty>No groups found.</CommandEmpty>
            <CommandGroup>
                {unselectedGroups.map((group) => (
                    <CommandItem
                    key={group.id}
                    onSelect={() => handleSelect(group.id)}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        selectedGroupIds.includes(group.id) ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {group.name}
                    </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function SettingsPage() {
  const [isSubmitting, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [allGroups, setAllGroups] = useState<Pick<Group, 'id' | 'name'>[]>([]);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      dailyPostLimit: 10,
      microPostGroupIds: [],
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [dailyPostLimit, microPostGroupsSetting, groupsData] = await Promise.all([
            getSetting('dailyPostLimit_default'),
            getSetting('microPostAllowedGroupIds'),
            getGroupsForForm()
        ]);
        
        if (dailyPostLimit) {
          form.setValue('dailyPostLimit', Number(dailyPostLimit.value));
        }

        if (microPostGroupsSetting?.value) {
            form.setValue('microPostGroupIds', microPostGroupsSetting.value.split(','));
        }

        setAllGroups(groupsData);
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
        await Promise.all([
           updateSetting('dailyPostLimit_default', String(data.dailyPostLimit)),
           updateSetting('microPostAllowedGroupIds', (data.microPostGroupIds || []).join(','))
        ]);

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
                Micro Post Settings
              </CardTitle>
              <CardDescription>
                Control which user groups can see the Micro Posts tab on the homepage.
              </CardDescription>
            </CardHeader>
             <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                    <FormField
                        control={form.control}
                        name="microPostGroupIds"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Allowed Groups</FormLabel>
                                <FormControl>
                                    <MultiSelectGroups
                                        allGroups={allGroups}
                                        selectedGroupIds={field.value || []}
                                        onSelectionChange={field.onChange}
                                    />
                                </FormControl>
                                <FormDescription>If no groups are selected, only Super Admins can see the tab.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
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

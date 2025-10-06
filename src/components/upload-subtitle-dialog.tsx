
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadSubtitle, getUsers } from '@/lib/actions';
import { SubtitleAccessLevel } from '@/lib/permissions';
import { User } from '@prisma/client';

const uploadSchema = z.object({
  language: z.string().min(1, 'Language is required.'),
  file: z.instanceof(File).refine(file => file.size > 0, 'A subtitle file is required.').optional(),
  accessLevel: z.nativeEnum(SubtitleAccessLevel),
  authorizedUsers: z.array(z.string()).optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface UploadSubtitleDialogProps {
  postId: number;
}

export default function UploadSubtitleDialog({ postId }: UploadSubtitleDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [allUsers, setAllUsers] = React.useState<User[]>([]);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      language: '',
      file: undefined,
      accessLevel: SubtitleAccessLevel.PUBLIC,
      authorizedUsers: [],
    },
  });

  React.useEffect(() => {
    async function fetchUsers() {
        if (isOpen) {
            try {
                const users = await getUsers();
                setAllUsers(users);
            } catch (error) {
                console.error("Failed to fetch users:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load user list."
                });
            }
        }
    }
    fetchUsers();
  }, [isOpen, toast]);

  const accessLevel = form.watch('accessLevel');

  const onSubmit = async (data: UploadFormValues) => {
    setIsSubmitting(true);
    
    if (!data.file) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Please select a subtitle file to upload.',
      });
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('language', data.language);
    formData.append('postId', String(postId));
    formData.append('accessLevel', data.accessLevel);
    if (data.accessLevel === SubtitleAccessLevel.AUTHORIZED_ONLY && data.authorizedUsers) {
      data.authorizedUsers.forEach(userId => formData.append('authorizedUsers', userId));
    }

    try {
      await uploadSubtitle(formData);
      toast({
        title: 'Upload Successful',
        description: 'Your subtitle has been uploaded and added to the post.',
      });
      setIsOpen(false);
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Subtitle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Subtitle</DialogTitle>
          <DialogDescription>
            Contribute to the community by uploading a subtitle file.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. English" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Subtitle File</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type="file"
                      accept=".srt,.vtt"
                      onChange={e => onChange(e.target.files?.[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(SubtitleAccessLevel).map(level => (
                        <SelectItem key={level} value={level}>{level.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Who should be able to download this subtitle?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {accessLevel === SubtitleAccessLevel.AUTHORIZED_ONLY && (
              <FormField
                control={form.control}
                name="authorizedUsers"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Authorized Users</FormLabel>
                      <FormDescription>
                        Select which users can download this subtitle.
                      </FormDescription>
                    </div>
                    <ScrollArea className="h-40 w-full rounded-md border">
                        <div className="p-4">
                            {allUsers.map((user) => (
                            <FormField
                                key={user.id}
                                control={form.control}
                                name="authorizedUsers"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={user.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(user.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), user.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== user.id
                                                )
                                            )
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {user.name} ({user.email})
                                    </FormLabel>
                                    </FormItem>
                                )
                                }}
                            />
                            ))}
                        </div>
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Uploading...' : 'Upload File'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

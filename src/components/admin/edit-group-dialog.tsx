

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';

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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateGroup } from '@/lib/actions';
import type { GroupForEditing } from '@/lib/types';
import { Edit, Upload, Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';

const MAX_FILE_SIZE = 4194304; // 4 MB

const groupFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().max(500, 'Description must not be longer than 500 characters.').optional(),
  profilePhoto: z.string().optional(),
  coverPhoto: z.string().optional(),
  isPremiumOnly: z.boolean().default(false),
});


type GroupFormValues = z.infer<typeof groupFormSchema>;

interface EditGroupDialogProps {
  group: GroupForEditing;
  triggerButton?: React.ReactNode;
}

export default function EditGroupDialog({ group, triggerButton }: EditGroupDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);

  const [previewAvatar, setPreviewAvatar] = React.useState<string | null>(group.profilePhoto);
  const [previewCover, setPreviewCover] = React.useState<string | null>(group.coverPhoto);

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: group.name || '',
      description: group.description || '',
      profilePhoto: group.profilePhoto || '',
      coverPhoto: group.coverPhoto || '',
      isPremiumOnly: group.isPremiumOnly || false,
    },

    mode: 'onChange',
  });

  const onSubmit = async (data: GroupFormValues) => {
    try {
      const updateData = {
        name: data.name,
        description: data.description,
        profilePhoto: previewAvatar,
        coverPhoto: previewCover,
        isPremiumOnly: data.isPremiumOnly,
      };


      await updateGroup(group.id, updateData);

      toast({
        title: 'Group updated',
        description: 'Your changes have been saved successfully.',
      });
      setIsOpen(false);
      router.refresh();

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update group.',
      });
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ variant: 'destructive', title: 'File too large', description: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'avatar') {
          setPreviewAvatar(reader.result as string);
          form.setValue('profilePhoto', reader.result as string);
        } else {
          setPreviewCover(reader.result as string);
          form.setValue('coverPhoto', reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // When dialog opens, reset the previews to the initial group data
  React.useEffect(() => {
    if (isOpen) {
      setPreviewAvatar(group.profilePhoto);
      setPreviewCover(group.coverPhoto);
      form.reset({
        name: group.name || '',
        description: group.description || '',
        profilePhoto: group.profilePhoto || '',
        coverPhoto: group.coverPhoto || '',
        isPremiumOnly: group.isPremiumOnly || false,
      });

    }
  }, [isOpen, group, form]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl h-[90svh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Make changes to the group profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow pr-6 -mr-6">
              <div className="space-y-6 py-4">

                {/* Cover Photo */}
                <FormItem>
                  <FormLabel>Cover Photo</FormLabel>
                  <div className="relative group aspect-[3/1] w-full bg-muted rounded-md overflow-hidden">
                    {previewCover ? (
                      <Image src={previewCover} alt="Cover preview" fill
                        style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <p>No cover photo</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button asChild variant="outline" className="bg-background/80">
                        <label htmlFor="cover-photo-file" className="cursor-pointer">
                          <Camera className="mr-2 h-4 w-4" />
                          Change Cover
                        </label>
                      </Button>
                      <input
                        id="cover-photo-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, 'cover')}
                      />
                    </div>
                  </div>
                  <FormControl>
                    <Input
                      placeholder='Or paste image URL'
                      className="mt-2"
                      defaultValue={group.coverPhoto || ''}
                      onChange={(e) => {
                        setPreviewCover(e.target.value);
                        form.setValue('coverPhoto', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage>{form.formState.errors.coverPhoto?.message}</FormMessage>
                </FormItem>

                {/* Profile Photo */}
                <FormItem>
                  <FormLabel>Profile Photo</FormLabel>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-24 h-24">
                      {previewAvatar && (
                        <AvatarImage src={previewAvatar} alt={group.name || 'Group'} />
                      )}
                      <AvatarFallback>
                        {group.name?.charAt(0).toUpperCase() || 'G'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-grow">
                      <FormControl>
                        <Input
                          id="profile-photo-url"
                          placeholder='Paste image URL'
                          defaultValue={group.profilePhoto || ''}
                          onChange={(e) => {
                            setPreviewAvatar(e.target.value);
                            form.setValue('profilePhoto', e.target.value);
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground text-center my-2">OR</p>
                      <Button asChild variant="outline" className='w-full'>
                        <label htmlFor="profile-photo-file" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </label>
                      </Button>
                      <input
                        id="profile-photo-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(e, 'avatar')}
                      />
                    </div>
                  </div>
                  <FormMessage>{form.formState.errors.profilePhoto?.message}</FormMessage>
                </FormItem>


                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Group Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us a little bit about this group"
                          className="resize-none"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPremiumOnly"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Premium Only
                        </FormLabel>
                        <FormDescription>
                          Only users with an active Premium subscription can join this group.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 mt-auto border-t">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

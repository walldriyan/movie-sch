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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, uploadProfileImage } from '@/lib/actions';
import type { User } from '@prisma/client';
import { Pencil, User as UserIcon, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';
import { ScrollArea } from './ui/scroll-area';

const MAX_FILE_SIZE = 1048576; // 1 MB

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  bio: z.string().max(160, 'Bio must not be longer than 160 characters.').optional(),
  image: z.string().optional(), // We'll handle the file object separately
  website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  twitter: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  linkedin: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  user: User;
}

export default function EditProfileDialog({ user }: EditProfileDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(user.image);
  const [imageFile, setImageFile] = React.useState<File | null>(null);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || '',
      bio: user.bio || '',
      image: user.image || '',
      website: user.website || '',
      twitter: user.twitter || '',
      linkedin: user.linkedin || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      let imageUrl = user.image; // Keep old image by default

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const newImageUrl = await uploadProfileImage(formData);
        if (newImageUrl) {
          imageUrl = newImageUrl;
        }
      } else if (data.image !== user.image) {
        // Handle URL pasting
        imageUrl = data.image;
      }


      const updateData = {
        name: data.name,
        bio: data.bio,
        website: data.website,
        twitter: data.twitter,
        linkedin: data.linkedin,
        image: imageUrl,
      };

      await updateUserProfile(user.id, updateData);
      
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved successfully.',
      });
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        form.setError("image", { message: "File size must be less than 1MB." });
        return;
      }
      form.clearErrors("image");

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md h-[80svh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow pr-6 -mr-6">
              <div className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      {previewImage ? (
                        <AvatarImage src={previewImage} alt={user.name || 'User'} />
                      ) : (
                        <UserIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                      <AvatarFallback>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-grow">
                      <Input
                          id="picture-url"
                          placeholder='Paste image URL'
                          defaultValue={user.image || ''}
                          onChange={(e) => {
                              form.setValue('image', e.target.value);
                              setPreviewImage(e.target.value);
                              setImageFile(null);
                          }}
                        />
                        <p className="text-xs text-muted-foreground text-center my-2">OR</p>
                        <Button asChild variant="outline" className='w-full'>
                            <label htmlFor="picture-file" className="cursor-pointer">
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Image
                            </label>
                        </Button>
                        <input
                            id="picture-file"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageChange(e)}
                        />
                    </div>

                  </div>
                  <FormMessage>{form.formState.errors.image?.message}</FormMessage>
                </FormItem>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us a little bit about yourself"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://your-website.com" {...field} value={field.value || ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/your-handle" {...field} value={field.value || ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://linkedin.com/in/your-profile" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

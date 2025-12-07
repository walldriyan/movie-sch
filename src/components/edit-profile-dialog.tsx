
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
import { updateUserProfile, uploadProfileImage, uploadProfileCoverImage } from '@/lib/actions';
import type { User } from '@prisma/client';
import { Pencil, User as UserIcon, Upload, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';
import { ScrollArea } from './ui/scroll-area';

const MAX_FILE_SIZE = 2097152; // 2 MB

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  bio: z.string().max(160, 'Bio must not be longer than 160 characters.').optional(),
  image: z.string().optional(),
  coverImage: z.string().optional(),
  website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  twitter: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  linkedin: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  user: User;
  triggerButton?: React.ReactNode;
}

export default function EditProfileDialog({ user, triggerButton }: EditProfileDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(user.image);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [previewCoverImage, setPreviewCoverImage] = React.useState<string | null>(user.coverImage);
  const [coverImageFile, setCoverImageFile] = React.useState<File | null>(null);


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user.name || '',
      bio: user.bio || '',
      image: user.image || '',
      coverImage: user.coverImage || '',
      website: user.website || '',
      twitter: user.twitter || '',
      linkedin: user.linkedin || '',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      let imageUrl = user.image;
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const newImageUrl = await uploadProfileImage(formData);
        if (newImageUrl) imageUrl = newImageUrl;
      } else if (data.image !== user.image) {
        imageUrl = data.image ?? null;
      }

      let coverImageUrl = user.coverImage;
      if (coverImageFile) {
        const formData = new FormData();
        formData.append('image', coverImageFile);
        const newCoverUrl = await uploadProfileCoverImage(formData);
        if (newCoverUrl) coverImageUrl = newCoverUrl;
      } else if (data.coverImage !== user.coverImage) {
        coverImageUrl = data.coverImage ?? null;
      }

      const updateData = {
        name: data.name,
        bio: data.bio,
        website: data.website,
        twitter: data.twitter,
        linkedin: data.linkedin,
        image: imageUrl,
        coverImage: coverImageUrl,
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

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        form.setError(type === 'avatar' ? 'image' : 'coverImage', { message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
        return;
      }
      form.clearErrors(type === 'avatar' ? 'image' : 'coverImage');

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'avatar') {
          setImageFile(file);
          setPreviewImage(reader.result as string);
        } else {
          setCoverImageFile(file);
          setPreviewCoverImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl h-[90svh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow pr-6 -mr-6">
              <div className="space-y-6 py-4">

                {/* Cover Image */}
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <div className="relative group aspect-[3/1] w-full bg-muted rounded-md p-2.5">
                    {previewCoverImage ? (
                      <Image src={previewCoverImage} alt="Cover preview" fill className="object-cover rounded-md" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <p>No cover image</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button asChild variant="outline" className="bg-background/80">
                        <label htmlFor="cover-image-file" className="cursor-pointer">
                          <Camera className="mr-2 h-4 w-4" />
                          Change Cover
                        </label>
                      </Button>
                      <input
                        id="cover-image-file"
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
                      defaultValue={user.coverImage || ''}
                      onChange={(e) => {
                        form.setValue('coverImage', e.target.value);
                        setPreviewCoverImage(e.target.value);
                        setCoverImageFile(null);
                      }}
                    />
                  </FormControl>
                  <FormMessage>{form.formState.errors.coverImage?.message}</FormMessage>
                </FormItem>

                {/* Avatar Image */}
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-24 h-24">
                      {previewImage ? (
                        <AvatarImage src={previewImage} alt={user.name || 'User'} />
                      ) : (
                        <UserIcon className="w-10 h-10 text-muted-foreground" />
                      )}
                      <AvatarFallback>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-grow">
                      <FormControl>
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
                      </FormControl>
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
                        onChange={(e) => handleImageChange(e, 'avatar')}
                      />
                    </div>
                  </div>
                  <FormMessage>{form.formState.errors.image?.message}</FormMessage>
                </FormItem>


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
                        <Input placeholder="https://your-website.com" {...field} value={field.value || ''} />
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
                        <Input placeholder="https://twitter.com/your-handle" {...field} value={field.value || ''} />
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
            <DialogFooter className="pt-4 mt-auto border-t">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
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

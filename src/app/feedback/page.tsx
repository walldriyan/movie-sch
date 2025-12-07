
'use client';

import { useState, useTransition, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitFeedback } from '@/lib/actions';
import { Loader2, MessageSquareWarning, Image as ImageIcon, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const feedbackSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(20, 'Description must be at least 20 characters long.'),
  image: z.any().optional()
    .refine(file => !file || (typeof File !== 'undefined' && file instanceof File && file.size <= 2 * 1024 * 1024), 'Image must be less than 2MB.'),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, startTransition] = useTransition();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewImage(null);
    form.setValue('image', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const onSubmit = (values: FeedbackFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('description', values.description);
        if (values.image) {
          formData.append('image', values.image);
        }

        await submitFeedback(formData);

        toast({
          title: 'Feedback Sent!',
          description: 'Thank you for your valuable feedback.',
        });
        form.reset();
        setPreviewImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: error.message || 'An unknown error occurred.',
        });
      }
    });
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MessageSquareWarning className="h-6 w-6 text-primary" />
            Submit Feedback
          </CardTitle>
          <CardDescription>
            Have a suggestion or encountered a bug? Let us know. We appreciate your input!
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="A short summary of your feedback" {...form.register('title')} />
              {form.formState.errors.title && <p className="text-sm text-destructive">{String(form.formState.errors.title.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe your feedback in detail..." rows={6} {...form.register('description')} />
              {form.formState.errors.description && <p className="text-sm text-destructive">{String(form.formState.errors.description.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Attach an Image (Optional)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              {form.formState.errors.image && <p className="text-sm text-destructive">{String(form.formState.errors.image.message)}</p>}
            </div>
            {previewImage && (
              <div className="relative w-48 h-48 border rounded-md">
                <Image src={previewImage} alt="Image preview" fill className="object-contain" />
                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}



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
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadSubtitle } from '@/lib/actions/postActions';
import { Subtitle } from '@prisma/client';

const uploadSchema = z.object({
  language: z.string().min(1, 'Language is required.'),
  file: z.instanceof(File).refine(file => file.size > 0, 'A subtitle file is required.').optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface UploadSubtitleDialogProps {
  postId: number;
  onUploadSuccess: (newSubtitle: Subtitle & { canDownload: boolean }) => void;
}

export default function UploadSubtitleDialog({ postId, onUploadSuccess }: UploadSubtitleDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      language: '',
      file: undefined,
    },
  });

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

    try {
      const newSubtitle = await uploadSubtitle(formData);
      if (newSubtitle) {
        onUploadSuccess({ ...newSubtitle, canDownload: true });
        toast({
          title: 'Upload Successful',
          description: 'Your subtitle has been uploaded and added to the post.',
        });
        setIsOpen(false);
        form.reset();
      } else {
        throw new Error('Upload did not return the new subtitle.');
      }
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

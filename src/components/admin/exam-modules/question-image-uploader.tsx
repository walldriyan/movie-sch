'use client';

import React, { useTransition, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { ImageIcon, Upload, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { uploadExamImage } from '@/lib/actions/exams';

interface QuestionImageUploaderProps {
  qIndex: number;
  iIndex: number;
  form: any;
}

export const QuestionImageUploader = React.memo(({ qIndex, iIndex, form }: QuestionImageUploaderProps) => {
  const { toast } = useToast();
  const [isUploading, startUploading] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Watch only the specific image URL we need
  const imageUrl = form.watch(`questions.${qIndex}.images.${iIndex}.url`);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(`[IMAGE_UPLOADER] File selected for Q${qIndex}, I${iIndex}:`, file.name);

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Image size must be less than 2MB.'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file.'
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    startUploading(async () => {
      try {
        // Create new abort controller
        abortControllerRef.current = new AbortController();

        console.log(`[IMAGE_UPLOADER] Uploading image...`);
        const uploadedUrl = await uploadExamImage(formData);

        if (!uploadedUrl) {
          throw new Error('Upload failed to return a URL.');
        }

        console.log(`[IMAGE_UPLOADER] Upload successful:`, uploadedUrl);

        // Update form value correctly without mutation
        const currentImages = form.getValues(`questions.${qIndex}.images`) || [];
        const newImages = [...currentImages];
        
        // Ensure the array has enough elements
        while (newImages.length <= iIndex) {
          newImages.push({ url: '' });
        }
        
        newImages[iIndex] = { url: uploadedUrl };

        // Use setValue with proper options
        form.setValue(`questions.${qIndex}.images`, newImages, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });

        toast({
          title: 'Image Uploaded',
          description: 'Image uploaded successfully.'
        });

        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

      } catch (err: any) {
        console.error('[IMAGE_UPLOADER] Error:', err);
        
        if (err.name !== 'AbortError') {
          toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: err.message || 'Failed to upload image.'
          });
        }
      } finally {
        // Clear file input on error too
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  }, [qIndex, iIndex, form, toast]);

  const handleUrlChange = useCallback((value: string) => {
    const currentImages = form.getValues(`questions.${qIndex}.images`) || [];
    const newImages = [...currentImages];
    
    while (newImages.length <= iIndex) {
      newImages.push({ url: '' });
    }
    
    newImages[iIndex] = { url: value };
    
    form.setValue(`questions.${qIndex}.images`, newImages, {
      shouldValidate: true,
      shouldDirty: true
    });
  }, [qIndex, iIndex, form]);

  const handleRemoveImage = useCallback(() => {
    handleUrlChange('');
  }, [handleUrlChange]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-20 h-20 bg-muted rounded-md flex items-center justify-center overflow-hidden group">
        {isUploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={`Image ${iIndex + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              disabled={isUploading}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </>
        ) : (
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      <div className="flex-grow space-y-2">
        <FormField
          control={form.control}
          name={`questions.${qIndex}.images.${iIndex}.url`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Paste URL or upload"
                  {...field}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  disabled={isUploading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
    </div>
  );
});

QuestionImageUploader.displayName = 'QuestionImageUploader';
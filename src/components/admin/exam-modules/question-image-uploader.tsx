
'use client';

import React, { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { ImageIcon, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { uploadExamImage } from '@/lib/actions/exams';

export const QuestionImageUploader = ({ qIndex, iIndex, form }: { qIndex: number, iIndex: number, form: any }) => {
    const { toast } = useToast();
    const [isUploading, startUploading] = useTransition();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const imageUrl = form.watch(`questions.${qIndex}.images.${iIndex}.url`);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        console.log(`[STEP 4.1] ImageUploader: File selected for Q${qIndex}, I${iIndex}:`, { name: file.name, size: file.size });

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({ variant: 'destructive', title: 'File too large', description: 'Image size must be less than 2MB.'});
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        startUploading(async () => {
            try {
                console.log(`[STEP 5] ImageUploader: Calling 'uploadExamImage' server action.`);
                const uploadedUrl = await uploadExamImage(formData);
                console.log(`[STEP 6] ImageUploader: Received URL from server:`, uploadedUrl);
                if (uploadedUrl) {
                    const currentImages = form.getValues(`questions.${qIndex}.images`);
                    currentImages[iIndex] = { url: uploadedUrl };
                    form.setValue(`questions.${qIndex}.images`, currentImages, { shouldValidate: true, shouldDirty: true });
                    console.log(`[STEP 7] ImageUploader: Set form value for questions.${qIndex}.images. Full form data:`, form.getValues());
                    toast({ title: 'Image Uploaded' });
                } else {
                    throw new Error('Upload failed to return a URL.');
                }
            } catch (err: any) {
                console.error('[ERROR] ImageUploader:', err);
                toast({ variant: 'destructive', title: 'Upload Failed', description: err.message });
            }
        });
    }
    
    return (
        <div className="flex items-center gap-2">
            <div className="relative w-20 h-20 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                ) : imageUrl ? (
                    <Image src={imageUrl} alt={`Image ${iIndex+1}`} fill className="object-cover" />
                ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
            </div>
            <div className="flex-grow">
                 <FormField 
                    control={form.control} 
                    name={`questions.${qIndex}.images.${iIndex}.url`} 
                    render={({ field }) => (
                      <FormItem>
                          <FormControl><Input placeholder={'Paste URL or upload'} {...field} disabled={isUploading}/></FormControl>
                          <FormMessage />
                      </FormItem>
                    )} 
                />
                 <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <Upload className="mr-2 h-4 w-4" /> Upload
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
};

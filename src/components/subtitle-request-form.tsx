'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { requestSubtitles, RequestSubtitlesOutput } from '@/ai/flows/ai-subtitle-request';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal, CheckCircle, XCircle, Bot } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const subtitleRequestSchema = z.object({
  language: z.string().min(2, {
    message: 'Language must be at least 2 characters.',
  }),
});

interface SubtitleRequestFormProps {
  movieTitle: string;
}

export default function SubtitleRequestForm({ movieTitle }: SubtitleRequestFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RequestSubtitlesOutput | null>(null);

  const form = useForm<z.infer<typeof subtitleRequestSchema>>({
    resolver: zodResolver(subtitleRequestSchema),
    defaultValues: {
      language: '',
    },
  });

  async function onSubmit(values: z.infer<typeof subtitleRequestSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const response = await requestSubtitles({
        movieTitle,
        language: values.language,
      });
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Failed to process subtitle request.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Japanese" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Analyzing...' : 'Request'}
          </Button>
        </form>
      </Form>
      {loading && (
        <div className="space-y-2 pt-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      )}
      {result && (
        <Alert variant={result.canGenerate ? 'default' : 'destructive'} className="mt-4">
          {result.canGenerate ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertTitle className="font-bold">
            {result.canGenerate ? 'Generation Possible' : 'Generation Unlikely'}
          </AlertTitle>
          <AlertDescription>{result.reason}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

'use server';

/**
 * @fileOverview This file defines an AI-powered subtitle request flow.
 *
 * - requestSubtitles - A function to request subtitles for a movie and assess if they can be generated.
 * - RequestSubtitlesInput - The input type for the requestSubtitles function.
 * - RequestSubtitlesOutput - The return type for the requestSubtitles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RequestSubtitlesInputSchema = z.object({
  movieTitle: z.string().describe('The title of the movie to generate subtitles for.'),
  language: z.string().describe('The language of the subtitles to generate.'),
});
export type RequestSubtitlesInput = z.infer<typeof RequestSubtitlesInputSchema>;

const RequestSubtitlesOutputSchema = z.object({
  canGenerate: z.boolean().describe('Whether or not subtitles can be generated for the movie and language.'),
  reason: z.string().describe('The reason why subtitles can or cannot be generated.'),
});
export type RequestSubtitlesOutput = z.infer<typeof RequestSubtitlesOutputSchema>;

export async function requestSubtitles(input: RequestSubtitlesInput): Promise<RequestSubtitlesOutput> {
  return requestSubtitlesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'requestSubtitlesPrompt',
  input: {schema: RequestSubtitlesInputSchema},
  output: {schema: RequestSubtitlesOutputSchema},
  prompt: `You are an AI assistant that determines whether subtitles can be generated for a given movie and language.

  Movie Title: {{{movieTitle}}}
  Language: {{{language}}}

  Consider factors such as the availability of the movie in the specified language, the complexity of the dialogue, and the availability of resources for subtitle generation.

  Respond with a JSON object indicating whether subtitles can be generated (canGenerate: boolean) and the reason for your assessment (reason: string).`,
});

const requestSubtitlesFlow = ai.defineFlow(
  {
    name: 'requestSubtitlesFlow',
    inputSchema: RequestSubtitlesInputSchema,
    outputSchema: RequestSubtitlesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

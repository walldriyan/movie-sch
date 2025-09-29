// A subtitle recommendation AI agent.
//
// - recommendSubtitles - A function that handles the subtitle recommendation process.
// - RecommendSubtitlesInput - The input type for the recommendSubtitles function.
// - RecommendSubtitlesOutput - The return type for the recommendSubtitles function.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendSubtitlesInputSchema = z.object({
  videoTitle: z.string().describe('The title of the currently watched video.'),
  videoDescription: z
    .string()
    .describe('A description of the currently watched video.'),
  subtitleLanguages: z
    .array(z.string())
    .describe('The list of available subtitle languages.'),
});
export type RecommendSubtitlesInput = z.infer<typeof RecommendSubtitlesInputSchema>;

const RecommendSubtitlesOutputSchema = z.object({
  recommendedSubtitles: z
    .array(z.string())
    .describe('The list of recommended subtitles in available languages.'),
});
export type RecommendSubtitlesOutput = z.infer<typeof RecommendSubtitlesOutputSchema>;

export async function recommendSubtitles(input: RecommendSubtitlesInput): Promise<RecommendSubtitlesOutput> {
  return recommendSubtitlesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendSubtitlesPrompt',
  input: {schema: RecommendSubtitlesInputSchema},
  output: {schema: RecommendSubtitlesOutputSchema},
  prompt: `You are an expert in recommending subtitles for videos.

  Based on the title and description of the currently watched video, and the list of available subtitle languages, recommend the most suitable subtitles.

  Video Title: {{{videoTitle}}}
  Video Description: {{{videoDescription}}}
  Available Subtitle Languages: {{#each subtitleLanguages}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Please provide a list of recommended subtitles in the available languages.
  `,
});

const recommendSubtitlesFlow = ai.defineFlow(
  {
    name: 'recommendSubtitlesFlow',
    inputSchema: RecommendSubtitlesInputSchema,
    outputSchema: RecommendSubtitlesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

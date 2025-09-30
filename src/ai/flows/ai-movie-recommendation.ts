// A Genkit flow to provide AI-powered movie recommendations based on the currently watched video.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MovieRecommendationInputSchema = z.object({
  movieTitle: z.string().describe('The title of the movie currently being watched.'),
  movieDescription: z.string().describe('A detailed description of the movie.'),
  userPreferences: z.string().optional().describe('Optional: The user\'s movie preferences.'),
});

export type MovieRecommendationInput = z.infer<typeof MovieRecommendationInputSchema>;

const MovieRecommendationOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string().describe('The title of the recommended movie.'),
      description: z.string().describe('A brief description of the recommended movie.'),
      reason: z.string().describe('Why this movie is recommended based on the input movie.'),
    })
  ).describe('A list of recommended movies.'),
});

export type MovieRecommendationOutput = z.infer<typeof MovieRecommendationOutputSchema>;

export async function getMovieRecommendations(input: MovieRecommendationInput): Promise<MovieRecommendationOutput> {
  return movieRecommendationFlow(input);
}

const movieRecommendationPrompt = ai.definePrompt({
  name: 'movieRecommendationPrompt',
  input: {
    schema: MovieRecommendationInputSchema,
  },
  output: {
    schema: MovieRecommendationOutputSchema,
  },
  prompt: `You are a movie recommendation expert. Based on the currently watched movie and the user's preferences, recommend other movies that the user might enjoy.

  Currently Watched Movie:
  Title: {{{movieTitle}}}
  Description: {{{movieDescription}}}

  User Preferences: {{{userPreferences}}}

  Please provide a list of movie recommendations, including the title, a brief description, and the reason for the recommendation.
  Format the output as a JSON array of movie objects, where each object has the keys 'title', 'description', and 'reason'.`,
});

const movieRecommendationFlow = ai.defineFlow(
  {
    name: 'movieRecommendationFlow',
    inputSchema: MovieRecommendationInputSchema,
    outputSchema: MovieRecommendationOutputSchema,
  },
  async input => {
    try {
      const {output} = await movieRecommendationPrompt(input);
      return output!;
    } catch (error) {
      console.error('Error getting AI recommendations, returning empty data.', error);
      // Return empty recommendations on error instead of mock data
      return {
        recommendations: []
      }
    }
  }
);

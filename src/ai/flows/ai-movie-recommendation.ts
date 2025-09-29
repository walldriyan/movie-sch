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
      console.error('Error getting AI recommendations, returning mock data.', error);
      return {
        recommendations: [
          {
            title: 'Interstellar',
            description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
            reason: 'Epic sci-fi with mind-bending concepts.',
          },
          {
            title: 'Dune',
            description: 'A noble family becomes embroiled in a war for control over the galaxy\'s most valuable asset.',
            reason: 'Grand-scale science fiction world-building.',
          },
          {
            title: 'Blade Runner 2049',
            description: 'A young Blade Runner\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.',
            reason: 'Visually stunning dystopian future.',
          },
          {
            title: 'The Matrix',
            description: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
            reason: 'Revolutionary action and philosophical questions.',
          },
        ]
      }
    }
  }
);
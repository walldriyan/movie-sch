export interface MovieRecommendationOutput {
    recommendations: Array<{
        title: string;
        description: string;
        reason: string;
    }>;
}

export async function getMovieRecommendations(params: {
    movieTitle: string;
    movieDescription: string;
}): Promise<MovieRecommendationOutput> {
    return {
        recommendations: [],
    };
}

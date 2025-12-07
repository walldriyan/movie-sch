export interface RequestSubtitlesOutput {
    canGenerate: boolean;
    reason: string;
}

export async function requestSubtitles(params: {
    movieTitle: string;
    language: string;
}): Promise<RequestSubtitlesOutput> {
    return {
        canGenerate: false,
        reason: "AI subtitle generation is currently disabled.",
    };
}

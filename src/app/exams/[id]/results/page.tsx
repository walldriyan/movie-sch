import { redirect } from 'next/navigation';

interface ExamResultsPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ submissionId?: string }>;
}

// Redirect /exams/[id]/results to /exams/[id]?view=results
export default async function ExamResultsPage({ params, searchParams }: ExamResultsPageProps) {
    const { id } = await params;
    const { submissionId } = await searchParams;

    if (submissionId) {
        redirect(`/exams/${id}?view=results&submissionId=${submissionId}`);
    } else {
        redirect(`/exams/${id}`);
    }
}

import { redirect } from 'next/navigation';

interface AdminExamPageProps {
    params: Promise<{ id: string }>;
}

// Redirect /admin/exams/[id] to /exams/[id]
export default async function AdminExamPage({ params }: AdminExamPageProps) {
    const { id } = await params;
    redirect(`/exams/${id}`);
}

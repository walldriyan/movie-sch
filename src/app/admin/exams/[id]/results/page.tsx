import { notFound } from 'next/navigation';
import { getExamResultsForAdmin } from '@/lib/actions';
import { auth } from '@/auth';
import { ROLES } from '@/lib/permissions';
import ExamResultsClient from '@/components/admin/exam-results-client';

export default async function ExamResultsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== ROLES.SUPER_ADMIN) {
    notFound();
  }

  const examId = parseInt(params.id, 10);
  if (isNaN(examId)) {
    notFound();
  }

  const { exam, submissions } = await getExamResultsForAdmin(examId);

  if (!exam) {
    notFound();
  }

  return <ExamResultsClient exam={exam} initialSubmissions={submissions} />;
}

import { redirect } from 'next/navigation';

// Redirect /admin/exams to /admin (main admin dashboard has exams tab)
export default function AdminExamsPage() {
    redirect('/admin');
}

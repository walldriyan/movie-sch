
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import { ROLES } from '@/lib/permissions';

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pt-5">
      {children}
    </main>
  );
}

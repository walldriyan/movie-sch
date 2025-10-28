
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  FilePlus,
  Users2,
  UserPlus,
  BookCheck,
  BellPlus,
  Subtitles,
} from 'lucide-react';
import { useLoading } from '@/context/loading-context';
import { useSession } from 'next-auth/react';
import { ROLES } from '@/lib/permissions';

export default function CreateButton() {
  const router = useRouter();
  const { withLoading } = useLoading();
  const { data: session } = useSession();

  const handleNavigation = (href: string) => {
    withLoading(async () => {
      router.push(href);
      await Promise.resolve();
    });
  };

  if (!session?.user) {
    return null;
  }

  const isSuperAdmin = session.user.role === ROLES.SUPER_ADMIN;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-5 w-5" />
          <span>Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Create New</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => handleNavigation('/manage?create=true')}>
          <FilePlus className="mr-2 h-4 w-4" />
          <span>Post</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleNavigation('/tools/subtitle-editor')}>
          <Subtitles className="mr-2 h-4 w-4" />
          <span>Subtitle Editor</span>
        </DropdownMenuItem>
        {isSuperAdmin && (
          <>
            <DropdownMenuItem onSelect={() => handleNavigation('/admin/groups')}>
              <Users2 className="mr-2 h-4 w-4" />
              <span>Group</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleNavigation('/admin/users')}>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>User</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleNavigation('/admin/exams')}>
              <BookCheck className="mr-2 h-4 w-4" />
              <span>Exam</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleNavigation('/admin/notifications')}>
              <BellPlus className="mr-2 h-4 w-4" />
              <span>Notification</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

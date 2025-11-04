
'use client';

import { auth } from '@/auth';
import { notFound, usePathname } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { 
    PanelLeft, 
    LayoutGrid, 
    List,
    Users,
    Users2,
    BookCheck,
    Bell,
    Settings,
    MessageSquareWarning, 
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
  }
  
  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex w-full">
      <Sidebar>
        <SidebarHeader>
            <h2 className="text-lg font-semibold">Manage</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/manage" passHref legacyBehavior>
                <SidebarMenuButton isActive={isActive('/manage')}>
                  <LayoutGrid />
                  Posts
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="/manage/series" passHref legacyBehavior>
                  <SidebarMenuButton isActive={isActive('/manage/series')} disabled>
                    <List />
                    Series
                  </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            
            {user.role === ROLES.SUPER_ADMIN && (
              <>
                <SidebarMenuItem>
                  <Link href="/admin/exams" passHref legacyBehavior>
                    <SidebarMenuButton isActive={isActive('/admin/exams')}>
                      <BookCheck />
                      Exams
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/admin/users" passHref legacyBehavior>
                    <SidebarMenuButton isActive={isActive('/admin/users')}>
                      <Users />
                      Users
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/admin/groups" passHref legacyBehavior>
                    <SidebarMenuButton isActive={isActive('/admin/groups')}>
                      <Users2 />
                      Groups
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/admin/notifications" passHref legacyBehavior>
                    <SidebarMenuButton isActive={isActive('/admin/notifications')}>
                      <Bell />
                      Notifications
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/admin/feedback" passHref legacyBehavior>
                    <SidebarMenuButton isActive={isActive('/admin/feedback')}>
                      <MessageSquareWarning />
                      Feedback
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/admin/settings" passHref legacyBehavior>
                    <SidebarMenuButton isActive={isActive('/admin/settings')}>
                      <Settings />
                      Settings
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </>
            )}

          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pt-5 w-full">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}


'use client';

import { useSession } from 'next-auth/react';
import { notFound, usePathname } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { 
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
import { Skeleton } from '@/components/ui/skeleton';

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  
  if (status === 'loading') {
    return (
      <div className="flex pt-16 w-full h-screen">
        <div className="w-64 h-full border-r p-2">
            <div className="flex flex-col space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
        <div className="flex-1 p-8">
            <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
  }
  
  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex pt-16">
      <Sidebar className="h-[calc(100vh-4rem)] w-64 fixed top-16">
        <SidebarHeader>
            <h2 className="text-lg font-semibold px-2">Manage</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/manage">
                <SidebarMenuButton isActive={isActive('/manage')}>
                  <LayoutGrid className="h-5 w-5" />
                  Posts
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="/manage/series">
                  <SidebarMenuButton isActive={isActive('/manage/series')} disabled>
                    <List className="h-5 w-5" />
                    Series
                  </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            
            {user.role === ROLES.SUPER_ADMIN && (
              <>
                <SidebarMenuItem>
                  <Link href="/admin/exams">
                    <SidebarMenuButton isActive={isActive('/admin/exams')}>
                      <BookCheck className="h-5 w-5" />
                      Exams
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/admin/users">
                    <SidebarMenuButton isActive={isActive('/admin/users')}>
                      <Users className="h-5 w-5" />
                      Users
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/admin/groups">
                    <SidebarMenuButton isActive={isActive('/admin/groups')}>
                      <Users2 className="h-5 w-5" />
                      Groups
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/admin/notifications">
                    <SidebarMenuButton isActive={isActive('/admin/notifications')}>
                      <Bell className="h-5 w-5" />
                      Notifications
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/admin/feedback">
                    <SidebarMenuButton isActive={isActive('/admin/feedback')}>
                      <MessageSquareWarning className="h-5 w-5" />
                      Feedback
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <Link href="/admin/settings">
                    <SidebarMenuButton isActive={isActive('/admin/settings')}>
                      <Settings className="h-5 w-5" />
                      Settings
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </>
            )}

          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-[calc(100vh-4rem)]">
        <div className="w-full max-w-7xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
}

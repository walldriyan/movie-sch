// This file now simply re-exports the layout from the /manage directory
// to ensure a single, consistent layout for all admin-related pages.
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
  SidebarInset,
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
      <div className="flex pt-16 w-full">
        <div className="w-64 h-[calc(100vh-4rem)] border-r p-2">
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
    <div className="flex w-full pt-16">
      <Sidebar className="h-[calc(100vh-4rem)] top-16">
        <SidebarHeader>
            <h2 className="text-lg font-semibold">Manage</h2>
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
      <SidebarInset className="ml-[16rem] overflow-hidden">
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}

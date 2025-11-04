
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
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
import { PanelLeft, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';

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
    <div className="flex w-full">
      <Sidebar>
        <SidebarHeader>
            <h2 className="text-lg font-semibold">Manage</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/manage" isActive>
                <LayoutGrid />
                Posts
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <List />
                Series
              </SidebarMenuButton>
            </SidebarMenuItem>
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

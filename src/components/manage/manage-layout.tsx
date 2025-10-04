import React from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Film,
  Home,
  LayoutGrid,
  Bookmark,
  User,
  Settings,
  Users,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import AuthGuard from '@/components/auth/auth-guard';
import { ROLES, PERMISSIONS } from '@/lib/permissions';
import { Session } from 'next-auth';

interface ManageLayoutProps {
  user: Session['user'] | undefined;
  children: React.ReactNode;
}

export default function ManageLayout({ user, children }: ManageLayoutProps) {
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-4');
  const canManage = user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role);

  return (
    <SidebarProvider className="bg-green-500">
      <Sidebar variant="inset" collapsible="icon">
        <SidebarContent className="p-0 flex flex-col bg-red-500">
          <div className="p-4">
            <Link href="/" className="flex items-center space-x-2">
              <Film className="h-7 w-7 text-primary" />
              <span className="inline-block font-bold font-serif text-2xl group-data-[collapsible=icon]:hidden">
                CineVerse
              </span>
            </Link>
          </div>
          <SidebarMenu className="p-4 gap-1.5">
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-base">
                <Link href="/">
                  <Home />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {canManage && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive className="text-base">
                  <Link href="/manage">
                    <LayoutGrid />
                    <span>My Movies</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            <AuthGuard requiredRole={ROLES.SUPER_ADMIN}>
               <SidebarMenuItem>
                <SidebarMenuButton asChild className="text-base">
                  <Link href="/admin/users">
                    <Users />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </AuthGuard>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-base">
                <Link href="/favorites">
                    <Bookmark />
                    <span>Favorites</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-base">
                <Link href={user ? `/profile/${user.id}` : '#'}>
                  <User />
                  <span>Profile</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="text-base">
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex-grow" />
        </SidebarContent>
        <SidebarFooter>
          {user && (
            <SidebarMenuButton asChild>
              <Link href="#">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.image || userAvatar?.imageUrl}
                    alt="User avatar"
                  />
                  <AvatarFallback>
                    {user.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="w-full">{user.name}</span>
              </Link>
            </SidebarMenuButton>
          )}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 mt-16">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

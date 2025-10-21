
'use client';

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
  Users2,
  Bell,
  BookCheck,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ROLES, PERMISSIONS } from '@/lib/permissions';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Skeleton } from '../ui/skeleton';

interface ManageLayoutProps {
  user: any; // Keep this for initial render if needed, but we'll prioritize useSession
  children: React.ReactNode;
}

export default function ManageLayout({ user: initialUser, children }: ManageLayoutProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user;

  const userAvatar = PlaceHolderImages.find((img) => img.id === 'avatar-4');
  
  const canManagePosts = user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const renderAdminLinks = () => {
    if (status === 'loading') {
      return (
        <>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </>
      )
    }
    if (isSuperAdmin) {
      return (
        <>
          <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin/exams'} className="text-base">
              <Link href="/admin/exams">
                  <BookCheck />
                  <span>Exams</span>
              </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin/users'} className="text-base">
              <Link href="/admin/users">
                  <Users />
                  <span>Users</span>
              </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin/groups'} className="text-base">
              <Link href="/admin/groups">
                  <Users2 />
                  <span>Groups</span>
              </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin/notifications'} className="text-base">
              <Link href="/admin/notifications">
                  <Bell />
                  <span>Notifications</span>
              </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin/settings'} className="text-base">
              <Link href="/admin/settings">
                  <Settings />
                  <span>Settings</span>
              </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>
        </>
      );
    }
    return null;
  }
  
  return (
    <SidebarProvider className="bg-transperent">
      <Sidebar className="bg-transperent" variant="inset" collapsible="icon">
        <SidebarContent className="p-0 flex flex-col bg-transperent">
          <div className="p-4">
            <Link href="/" className="flex items-center space-x-2">
              <Film className="h-7 w-7 text-primary" />
              <span className="inline-block font-bold font-serif text-2xl group-data-[collapsible=icon]:hidden">
                CineVerse
              </span>
            </Link>
          </div>
          <div className="p-4 flex flex-col gap-4">
             {/* Main Navigation Group */}
            <div className="bg-muted/60 p-2 rounded-lg">
                <SidebarMenu>
                    <SidebarMenuItem>
                    <SidebarMenuButton asChild className="text-base" isActive={pathname === '/'}>
                        <Link href="/">
                        <Home />
                        <span>Home</span>
                        </Link>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                    {canManagePosts && (
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/manage'} className="text-base">
                        <Link href="/manage">
                            <LayoutGrid />
                            <span>My Movies</span>
                        </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    )}
                    {renderAdminLinks()}
                </SidebarMenu>
            </div>
            {/* Personal Group */}
            <div className="bg-muted/60 p-2 rounded-lg">
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathname === '/favorites'} className="text-base">
                            <Link href="/favorites">
                                <Bookmark />
                                <span>Favorites</span>
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={user ? pathname === `/profile/${user.id}` : false} className="text-base">
                            <Link href={user ? `/profile/${user.id}` : '#'}>
                            <User />
                            <span>Profile</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 </SidebarMenu>
            </div>
          </div>
          <div className="flex-grow" />
        </SidebarContent>
        <SidebarFooter>
          {user && (
            <SidebarMenuButton asChild>
              <Link href={`/profile/${user.id}`}>
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
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 mt-2">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

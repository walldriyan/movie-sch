
'use client';

import {
  Film,
  LayoutGrid,
  LogIn,
  User,
  Users,
  Bookmark,
  PlusCircle,
  FilePlus,
  Users2,
  UserPlus,
  BookCheck,
  BellPlus,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import React from 'react';
import { Button } from './ui/button';
import LogoutButton from './auth/logout-button';
import { ROLES } from '@/lib/permissions';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import HeaderApprovals from './header-approvals';
import type { Session } from 'next-auth';
import AuthGuard from './auth/auth-guard';

export default function HeaderClient({ session: serverSession }: { session: Session | null }) {
  // We receive the session from the server component as a prop to avoid hydration issues in the header.
  const session = serverSession;
  const sessionStatus = session ? 'authenticated' : 'unauthenticated';

  const user = session?.user;

  const userAvatarPlaceholder = PlaceHolderImages.find(
    (img) => img.id === 'avatar-4'
  );

  const getBadgeVariant = (role: string) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return 'default';
      case ROLES.USER_ADMIN:
        return 'info';
      case ROLES.USER:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const renderCreateButton = () => {
    if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
      return null;
    }

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
            <DropdownMenuItem asChild>
                <Link href="/manage?create=true">
                    <FilePlus className="mr-2 h-4 w-4" />
                    <span>Post</span>
                </Link>
            </DropdownMenuItem>
            <AuthGuard requiredRole={ROLES.SUPER_ADMIN}>
                <DropdownMenuItem asChild>
                    <Link href="/admin/groups">
                        <Users2 className="mr-2 h-4 w-4" />
                        <span>Group</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/admin/users">
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>User</span>
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/admin/exams">
                        <BookCheck className="mr-2 h-4 w-4" />
                        <span>Exam</span>
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/admin/notifications">
                        <BellPlus className="mr-2 h-4 w-4" />
                        <span>Notification</span>
                    </Link>
                </DropdownMenuItem>
            </AuthGuard>
        </DropdownMenuContent>
    </DropdownMenu>
    );
  };

  const renderUserMenu = () => {
    if (sessionStatus === 'loading') {
        return <div className="h-10 w-24 bg-muted rounded-md animate-pulse" />;
    }

    if (!user) {
      return (
        <Button asChild variant="ghost">
          <Link href="/login" className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            <span>Login</span>
          </Link>
        </Button>
      );
    }
  
    const canManage = [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(
      user.role
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 rounded-full px-2 space-x-2 justify-start"
          >
            <Avatar className="cursor-pointer h-8 w-8">
              <AvatarImage
                src={user.image || userAvatarPlaceholder?.imageUrl}
                alt={user.name || 'User'}
                data-ai-hint="person face"
              />
              <AvatarFallback>
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium">{user.name}</span>
              <Badge
                variant={getBadgeVariant(user.role)}
                className={cn(
                  'h-auto px-1 py-0 text-[9px] leading-tight',
                  {
                    'bg-green-500/80': user.role === ROLES.SUPER_ADMIN,
                  }
                )}
              >
                {user.role}
              </Badge>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-2">
          <DropdownMenuLabel>
            <p>My Account</p>
            <p className="text-xs text-muted-foreground font-normal truncate">
              {user.email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/profile/${user.id}`}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/favorites">
              <Bookmark className="mr-2 h-4 w-4" />
              <span>My Favorites</span>
            </Link>
          </DropdownMenuItem>
          {canManage && (
            <DropdownMenuItem asChild>
              <Link href="/manage">
                <LayoutGrid className="mr-2 h-4 w-4" />
                <span>Manage Movies</span>
              </Link>
            </DropdownMenuItem>
          )}
          {user.role === ROLES.SUPER_ADMIN && (
            <DropdownMenuItem asChild>
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                <span>Manage Users</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <LogoutButton />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-white/10 z-header">
      <div className="px-4 flex h-16 items-center justify-between gap-8">
        <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <Film className="h-7 w-7 text-primary" />
              <span className="inline-block font-bold font-serif text-2xl">
                WALL
              </span>
            </Link>
          </div>
        <div className="flex items-center justify-end space-x-2">
          {renderCreateButton()}
          {user &&  <HeaderApprovals />  }
         
          {renderUserMenu()}
        </div>
      </div>
    </header>
  );
}

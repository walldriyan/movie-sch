'use server';

import { Film, LayoutGrid, LogIn, User, Users, Bookmark } from 'lucide-react';
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
import { auth } from '@/auth';
import { Button } from './ui/button';
import LogoutButton from './auth/logout-button';
import { ROLES } from '@/lib/permissions';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import HeaderApprovals from './header-approvals';

export default async function Header({
  children,
}: {
  children?: React.ReactNode;
}) {
  const session = await auth();
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
  }

  const renderUserMenu = () => {
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
    
    const canManage = [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 rounded-full px-2 space-x-2 justify-start">
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
              <Badge variant={getBadgeVariant(user.role)} className={cn('h-auto px-1 py-0 text-[9px] leading-tight', {
                'bg-green-500/80': user.role === ROLES.SUPER_ADMIN,
              })}>
                {user.role}
              </Badge>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
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
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-lg border-b border-white/10">
      <div className="px-4 flex h-16 items-center justify-between gap-8">
        {children || (
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <Film className="h-7 w-7 text-primary" />
              <span className="inline-block font-bold font-serif text-2xl">
                CineVerse
              </span>
            </Link>
          </div>
        )}
        <div className="flex items-center justify-end space-x-2">
          <HeaderApprovals />
          {renderUserMenu()}
        </div>
      </div>
    </header>
  );
}

'use server';

import { Film, LayoutGrid, LogIn, User } from 'lucide-react';
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

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
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
          {user.role === 'SUPER_ADMIN' && (
            <DropdownMenuItem asChild>
              <Link href="/manage">
                <LayoutGrid className="mr-2 h-4 w-4" />
                <span>Manage Movies</span>
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 flex h-16 items-center justify-between gap-8">
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
        <div className="flex items-center justify-end space-x-4">
          {renderUserMenu()}
        </div>
      </div>
    </header>
  );
}

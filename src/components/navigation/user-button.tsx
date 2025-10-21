
'use client';

import {
  User as UserIcon,
  Bookmark,
  LayoutGrid,
  Users,
  LogOut,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react'; // Import client-side signOut
import { ROLES } from '@/lib/permissions';
import type { Session } from 'next-auth';
import { useState } from 'react';

function LogoutMenuItem() {
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    setIsPending(true);
    // Use client-side signOut. It handles session update and redirection.
    await signOut({ callbackUrl: '/' });
    // No need to set isPending back to false as the page will redirect.
  };

  return (
    <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={isPending}>
      <button onClick={handleSignOut} disabled={isPending} className="flex w-full items-center">
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="mr-2 h-4 w-4" />
        )}
        <span>{isPending ? 'Logging out...' : 'Log out'}</span>
      </button>
    </DropdownMenuItem>
  );
}

export default function UserButton({ user }: { user: Session['user'] }) {
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
  
  const canManage = user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role);

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
          <div className="flex-col items-start hidden md:flex">
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
            <UserIcon className="mr-2 h-4 w-4" />
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
              <span>Manage Posts</span>
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
        <LogoutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

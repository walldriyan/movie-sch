
'use client';

import {
  User as UserIcon,
  Bookmark,
  LayoutGrid,
  Users,
  LogOut,
  Loader2,
  MessageSquareWarning,
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
import { useSession } from 'next-auth/react';
import { ROLES } from '@/lib/permissions';
import { Skeleton } from '../ui/skeleton';
import { doSignOut } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import ConnectivityIndicator from '../connectivity-indicator';


function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="flex w-full items-center">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      <span>{pending ? 'Logging out...' : 'Log out'}</span>
    </button>
  )
}

function LogoutMenuItem() {
  return (
    <form action={doSignOut} className="w-full">
      <DropdownMenuItem asChild>
        <LogoutButton />
      </DropdownMenuItem>
    </form>
  );
}

export default function UserButton() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const userAvatarPlaceholder = PlaceHolderImages.find(
    (img) => img.id === 'avatar-4'
  );

  if (status === 'loading') {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user) {
    return null;
  }

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
          <div className="relative">
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
            <ConnectivityIndicator />
          </div>
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
          <Link href="/activity">
            <Bookmark className="mr-2 h-4 w-4" />
            <span>Activity Hub</span>
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
            <Link href="/admin">
              <Users className="mr-2 h-4 w-4" />
              <span>Admin Dashboard</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <LogoutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

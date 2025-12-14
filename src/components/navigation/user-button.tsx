
'use client';

import {
  User as UserIcon,
  Bookmark,
  LayoutGrid,
  Users,
  LogOut,
  Loader2,
  MessageSquareWarning,
  Activity,
  Heart,
  Shield,
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
          className="relative h-10 rounded-full px-2 space-x-2 justify-start bg-[#111112] border border-white/[0.08] hover:bg-white/10 hover:text-white text-white transition-colors"
        >
          <div className="relative">
            <Avatar className="cursor-pointer h-7 w-7 md:h-8 md:w-8">
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
            <span className="text-xs font-medium text-white">{user.name}</span>
            <Badge
              variant={getBadgeVariant(user.role)}
              className={cn(
                'h-auto px-1 py-0 text-[9px] leading-tight border-white/20 text-white/70',
                {
                  'bg-green-500/80 text-white': user.role === ROLES.SUPER_ADMIN,
                }
              )}
            >
              {user.role}
            </Badge>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2 bg-black/80 backdrop-blur-xl border-white/10 rounded-2xl text-white shadow-2xl animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2">
        <DropdownMenuLabel className="px-3 py-2">
          <p className="font-semibold text-sm">My Account</p>
          <p className="text-xs text-muted-foreground font-normal truncate mt-0.5">
            {user.email}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/10 my-1" />

        <div className="space-y-1">
          <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer">
            <Link href={`/profile/${user.id}`} className="flex items-center">
              <div className="bg-purple-500/10 p-1 rounded-lg mr-3 text-purple-400">
                <UserIcon className="h-4 w-4" />
              </div>
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer">
            <Link href="/activity" className="flex items-center">
              <div className="bg-blue-500/10 p-1 rounded-lg mr-3 text-blue-400">
                <Activity className="h-4 w-4" />
              </div>
              <span>Activity Hub</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer">
            <Link href="/favorites" className="flex items-center">
              <div className="bg-red-500/10 p-1 rounded-lg mr-3 text-red-400">
                <Heart className="h-4 w-4" />
              </div>
              <span>My Favorites</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer">
            <Link href="/groups?v=1" className="flex items-center">
              <div className="bg-indigo-500/10 p-1 rounded-lg mr-3 text-indigo-400">
                <Users className="h-4 w-4" />
              </div>
              <span>My Groups</span>
            </Link>
          </DropdownMenuItem>
        </div>

        {(canManage || user.role === ROLES.SUPER_ADMIN) && (
          <>
            <DropdownMenuSeparator className="bg-white/10 my-1" />
            <div className="space-y-1">
              <p className="px-2 py-1.5 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                Management
              </p>
              {canManage && (
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer">
                  <Link href="/manage" className="flex items-center">
                    <div className="bg-orange-500/10 p-1 rounded-lg mr-3 text-orange-400">
                      <LayoutGrid className="h-4 w-4" />
                    </div>
                    <span>Manage Posts</span>
                  </Link>
                </DropdownMenuItem>
              )}
              {user.role === ROLES.SUPER_ADMIN && (
                <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white rounded-xl cursor-pointer">
                  <Link href="/admin" className="flex items-center">
                    <div className="bg-green-500/10 p-1 rounded-lg mr-3 text-green-400">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span>Admin Dashboard</span>
                  </Link>
                </DropdownMenuItem>
              )}
            </div>
          </>
        )}

        <DropdownMenuSeparator className="bg-white/10 my-1" />

        <div className="pt-1">
          <LogoutMenuItem />
        </div>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}

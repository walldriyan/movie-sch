'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Home,
  User,
  LayoutGrid,
  LogIn
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/context/loading-context';
import HeaderApprovals from '../header-approvals';
import UserButton from './user-button';
import CreateButton from './create-button';
import { ROLES } from '@/lib/permissions';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { withLoading } = useLoading();
  const user = session?.user;
  const canManage = user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role);

  const handleNavigation = (href: string) => {
    withLoading(async () => {
      router.push(href);
      await Promise.resolve();
    });
  };
  
  const renderUserMenu = () => {
    if (status === 'loading') {
      return (
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 hidden md:block" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      );
    }

    if (status === 'authenticated' && user) {
      return (
        <div className="flex items-center gap-2">
          {canManage && <CreateButton />}
          <HeaderApprovals />
          <UserButton />
        </div>
      );
    }

    return (
      <Button asChild>
        <Link href="/login">
          <LogIn className="h-5 w-5" />
          <span className="hidden sm:inline ml-2">Login</span>
        </Link>
      </Button>
    );
  };

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-white/10 z-header">
      <div className="px-4 flex h-16 items-center justify-between gap-8">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <Link href="/" onClick={(e) => { e.preventDefault(); handleNavigation('/'); }} className="flex items-center space-x-2 flex-shrink-0">
            <Image src="/logo.png" alt="Logo" width={38} height={38} style={{ objectFit: 'cover' }} />
          </Link>
           <div className="flex items-center gap-2 ml-6 flex-shrink-0">
              <Button variant="ghost" asChild className="h-auto flex flex-col items-center gap-1 p-1">
                <Link href="/">
                    <Home />
                    <span className="text-xs">Home</span>
                </Link>
              </Button>
              {user && status === 'authenticated' && (
                <>
                  <Button variant="ghost" asChild className="h-auto flex flex-col items-center gap-1 p-1">
                    <Link href={`/profile/${user.id}`}>
                      <User />
                      <span className="text-xs">Profile</span>
                    </Link>
                  </Button>
                  {canManage && (
                      <Button variant="ghost" asChild className="h-auto flex flex-col items-center gap-1 p-1">
                          <Link href="/manage">
                              <LayoutGrid />
                              <span className="text-xs">Manage</span>
                          </Link>
                      </Button>
                  )}
                </>
              )}
           </div>
        </div>
        <div className="flex items-center justify-end space-x-2 flex-shrink-0">
          {renderUserMenu()}
        </div>
      </div>
    </header>
  );
}

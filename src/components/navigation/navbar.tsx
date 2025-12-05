'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Home,
  User,
  Shield,
  LogIn,
  Heart,
  MessageSquare,
  Activity,
  Menu,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useLoading } from '@/context/loading-context';
import HeaderApprovals from '../header-approvals';
import UserButton from './user-button';
import CreateButton from './create-button';
import { ROLES } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import React from 'react';
import { canUserAccessMicroPosts } from '@/lib/actions/users';

export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { withLoading } = useLoading();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showWall, setShowWall] = React.useState(false);
  const user = session?.user;
  const canManage = user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role);

  React.useEffect(() => {
    async function checkWallAccess() {
      if (status === 'authenticated') {
        const canAccess = await canUserAccessMicroPosts();
        setShowWall(canAccess);
      } else {
        setShowWall(false);
      }
    }
    checkWallAccess();
  }, [status]);

  const handleNavigation = (href: string) => {
    withLoading(async () => {
      router.push(href);
      setMobileMenuOpen(false);
      await Promise.resolve();
    });
  };

  const isActive = (path: string) => pathname === path;

  // Mobile nav link component
  const MobileNavLink = ({
    href,
    icon: Icon,
    children,
    show = true
  }: {
    href: string;
    icon: React.ElementType;
    children: React.ReactNode;
    show?: boolean;
  }) => {
    if (!show) return null;

    return (
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 h-12",
          isActive(href) && "bg-primary/10 text-primary"
        )}
        onClick={() => handleNavigation(href)}
      >
        <Icon className="h-5 w-5" />
        <span>{children}</span>
      </Button>
    );
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
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-lg shadow-lg shadow-black/10 z-header">
      <div className="px-4 flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => { e.preventDefault(); handleNavigation('/'); }}
          className="flex items-center space-x-2 flex-shrink-0"
        >
          <Image src="/logo.png" alt="Logo" width={38} height={38} />
          <span className="font-bold text-lg hidden sm:inline bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            CineVerse
          </span>
        </Link>

        {/* Search Bar (Placeholder - can be implemented later) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          {/* Future search implementation */}
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center justify-end space-x-2 flex-shrink-0">
          {renderUserMenu()}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile menu header */}
                  <div className="p-4 border-b border-white/10">
                    <Link href="/" className="flex items-center gap-2">
                      <Image src="/logo.png" alt="Logo" width={32} height={32} />
                      <span className="font-bold text-lg">CineVerse</span>
                    </Link>
                  </div>

                  {/* Mobile navigation */}
                  <nav className="flex flex-col p-2 space-y-1">
                    <MobileNavLink href="/" icon={Home}>Home</MobileNavLink>
                    <MobileNavLink href="/wall" icon={MessageSquare} show={showWall}>Wall</MobileNavLink>

                    {user && (
                      <>
                        <div className="h-px bg-white/10 my-2" />
                        <MobileNavLink href="/activity" icon={Activity}>Activity</MobileNavLink>
                        <MobileNavLink href="/favorites" icon={Heart}>Favorites</MobileNavLink>
                        {canManage && (
                          <MobileNavLink href="/manage" icon={Shield}>Dashboard</MobileNavLink>
                        )}
                        <div className="h-px bg-white/10 my-2" />
                        <MobileNavLink href={`/profile/${user.id}`} icon={User}>Profile</MobileNavLink>
                      </>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

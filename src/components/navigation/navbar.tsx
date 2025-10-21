'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Home,
  User,
  LayoutGrid,
  LogIn,
  BookCheck,
  Users,
  Bell,
  Settings,
  Users2
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
import { Menu } from 'lucide-react';
import React from 'react';
import AuthGuard from '../auth/auth-guard';


export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { withLoading } = useLoading();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const user = session?.user;
  const canManage = user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role);

  const handleNavigation = (href: string) => {
    withLoading(async () => {
      router.push(href);
      setMobileMenuOpen(false); // Close mobile menu on navigation
      await Promise.resolve();
    });
  };

  const isActive = (path: string) => pathname === path;

  const NavLink = ({ href, children, mobile = false }: { href: string, children: React.ReactNode, mobile?: boolean }) => {
    const className = mobile
      ? `text-lg font-medium ${isActive(href) ? 'text-primary' : ''}`
      : `transition-colors hover:text-primary ${isActive(href) ? 'text-primary' : 'text-foreground/60'}`;
      
    return (
      <Link href={href} className={className} onClick={(e) => { e.preventDefault(); handleNavigation(href); }}>
        {children}
      </Link>
    );
  };
  
  const AdminLinks = ({ mobile }: { mobile?: boolean }) => (
    <AuthGuard requiredRole={ROLES.SUPER_ADMIN}>
        <NavLink href="/admin/exams" mobile={mobile}><BookCheck className="mr-2 h-4 w-4" />Exams</NavLink>
        <NavLink href="/admin/users" mobile={mobile}><Users className="mr-2 h-4 w-4" />Users</NavLink>
        <NavLink href="/admin/groups" mobile={mobile}><Users2 className="mr-2 h-4 w-4" />Groups</NavLink>
        <NavLink href="/admin/notifications" mobile={mobile}><Bell className="mr-2 h-4 w-4" />Notifications</NavLink>
        <NavLink href="/admin/settings" mobile={mobile}><Settings className="mr-2 h-4 w-4" />Settings</NavLink>
    </AuthGuard>
  );

  const renderNavLinks = (isMobile = false) => {
    const navClass = isMobile ? "flex flex-col space-y-4 mt-8" : "hidden md:flex items-center space-x-6 text-sm font-medium";

    return (
       <nav className={navClass}>
        <NavLink href="/" mobile={isMobile}>Home</NavLink>
        {canManage && <NavLink href="/manage" mobile={isMobile}>Manage</NavLink>}
        {user?.role === ROLES.SUPER_ADMIN && !isMobile && (
            <Link href="/admin/users" className={cn('transition-colors hover:text-primary', pathname?.startsWith('/admin') ? 'text-primary' : 'text-foreground/60')}>
              Admin
            </Link>
        )}
        {user?.role === ROLES.SUPER_ADMIN && isMobile && <AdminLinks mobile />}
        <NavLink href="/favorites" mobile={isMobile}>Favorites</NavLink>
        {user && <NavLink href={`/profile/${user.id}`} mobile={isMobile}>Profile</NavLink>}
      </nav>
    );
  }

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
        <div className="flex items-center gap-4">
          <Link href="/" onClick={(e) => { e.preventDefault(); handleNavigation('/'); }} className="flex items-center space-x-2 flex-shrink-0">
            <Image src="/logo.png" alt="Logo" width={38} height={38} />
             <span className="inline-block font-bold font-serif text-2xl">CineVerse</span>
          </Link>
          {renderNavLinks()}
        </div>
        <div className="flex items-center justify-end space-x-2 flex-shrink-0">
          {renderUserMenu()}

           <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                {renderNavLinks(true)}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

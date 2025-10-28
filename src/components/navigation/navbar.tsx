
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
  Users2,
  Shield,
  Bookmark,
  Heart,
  MessageSquare
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
      setMobileMenuOpen(false); // Close mobile menu on navigation
      await Promise.resolve();
    });
  };

  const isActive = (path: string) => pathname === path;

  const NavLink = ({ href, children, mobile = false, icon }: { href: string, children: React.ReactNode, mobile?: boolean, icon: React.ReactNode }) => {
    const className = mobile
      ? `text-lg font-medium flex items-center ${isActive(href) ? 'text-primary' : ''}`
      : `transition-colors hover:text-primary h-auto p-2 ${isActive(href) ? 'text-primary bg-muted' : 'text-foreground/80'}`;
      
    return (
      <Button asChild variant="ghost" className={cn("justify-center", className, "flex flex-col items-center h-full")}>
        <Link href={href} onClick={(e) => { e.preventDefault(); handleNavigation(href); }}>
          <div className="mb-1">{icon}</div>
          <span className="text-xs">{children}</span>
        </Link>
      </Button>
    );
  };
  
  const AdminLinks = ({ mobile }: { mobile?: boolean }) => (
    <AuthGuard requiredRole={ROLES.SUPER_ADMIN}>
        <NavLink href="/admin/exams" mobile={mobile} icon={<BookCheck className="h-5 w-5" />}>Exams</NavLink>
        <NavLink href="/admin/users" mobile={mobile} icon={<Users className="h-5 w-5" />}>Users</NavLink>
        <NavLink href="/admin/groups" mobile={mobile} icon={<Users2 className="h-5 w-5" />}>Groups</NavLink>
        <NavLink href="/admin/notifications" mobile={mobile} icon={<Bell className="h-5 w-5" />}>Notifications</NavLink>
        <NavLink href="/admin/settings" mobile={mobile} icon={<Settings className="h-5 w-5" />}>Settings</NavLink>
    </AuthGuard>
  );

  const renderNavLinks = (isMobile = false) => {
    const navClass = isMobile ? "flex flex-col space-y-2 mt-8" : "hidden md:flex items-center space-x-2 ml-[100px]";

    return (
       <nav className={navClass}>
        <NavLink href="/" mobile={isMobile} icon={<Home className="h-5 w-5"/>}>Home</NavLink>
        {showWall && (
           <NavLink href="/wall" mobile={isMobile} icon={<MessageSquare className="h-5 w-5"/>}>Wall</NavLink>
        )}
        {canManage && <NavLink href="/manage" mobile={isMobile} icon={<LayoutGrid className="h-5 w-5"/>}>Manage</NavLink>}
        {user?.role === ROLES.SUPER_ADMIN && (
          <NavLink href="/admin/users" mobile={isMobile} icon={<Shield className="h-5 w-5"/>}>Admin</NavLink>
        )}
        {user && <NavLink href="/favorites" mobile={isMobile} icon={<Heart className="h-5 w-5"/>}>Favorites</NavLink>}
        {user && <NavLink href={`/profile/${user.id}`} mobile={isMobile} icon={<User className="h-5 w-5"/>}>Profile</NavLink>}
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

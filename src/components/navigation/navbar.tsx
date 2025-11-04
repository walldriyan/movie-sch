
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
  MessageSquare,
  Activity,
  ChevronRight,
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
import React, { useState } from 'react';
import AuthGuard from '../auth/auth-guard';
import { canUserAccessMicroPosts } from '@/lib/actions/users';
import { motion } from 'framer-motion';
import ConnectivityIndicator from '../connectivity-indicator';


export default function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { withLoading } = useLoading();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
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

  const NavLink = ({ href, children, mobile = false, icon, hidden }: { href: string, children: React.ReactNode, mobile?: boolean, icon: React.ReactNode, hidden?: boolean }) => {
    const activeStyles = "text-primary bg-muted/20 backdrop-blur-sm";
    const inactiveStyles = "text-foreground/80";

    const className = mobile
      ? `text-lg font-medium flex items-center ${isActive(href) ? 'text-primary' : ''}`
      : `transition-colors hover:text-primary h-auto px-3 py-2 rounded-full ${isActive(href) ? activeStyles : inactiveStyles}`;
      
    return (
      <Button asChild variant="ghost" className={cn("justify-center", className, "flex flex-col items-center h-full", hidden && 'hidden')}>
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
    const navClass = isMobile ? "flex flex-col space-y-2 mt-8" : "hidden md:flex items-center space-x-2";

    return (
       <nav className={navClass}>
        <NavLink href="/" mobile={isMobile} icon={<Home className="h-5 w-5"/>}>Home</NavLink>
        <NavLink href="/wall" mobile={isMobile} icon={<MessageSquare className="h-5 w-5"/>} hidden={!isNavExpanded || !showWall}>Wall</NavLink>
        {user && <NavLink href="/activity" mobile={isMobile} icon={<Activity className="h-5 w-5"/>} hidden={!isNavExpanded}>Activity</NavLink>}
        {canManage && <NavLink href="/manage" mobile={isMobile} icon={<Shield className="h-5 w-5"/>} hidden={!isNavExpanded}>Dashboard</NavLink>}
        {user && <NavLink href="/favorites" mobile={isMobile} icon={<Heart className="h-5 w-5"/>} hidden={!isNavExpanded}>Favorites</NavLink>}
        {user && <NavLink href={`/profile/${user.id}`} mobile={isMobile} icon={<User className="h-5 w-5"/>} hidden={!isNavExpanded}>Profile</NavLink>}
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
          <ConnectivityIndicator />
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
      <div className="px-4 flex h-16 items-center justify-between gap-8">
        <div 
            className={cn(
              "flex items-center gap-4 transition-all duration-300 ease-in-out relative"
            )}
        >
          <Link href="/" onClick={(e) => { e.preventDefault(); handleNavigation('/'); }} className="flex items-center space-x-2 flex-shrink-0">
            <Image src="/logo.png" alt="Logo" width={38} height={38} />
          </Link>
          <motion.div 
            className={cn(
              "flex items-center p-1 rounded-full bg-background/80 border border-border/10 shadow-sm"
            )}
            animate={{ width: isNavExpanded ? 'auto' : 64 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <nav className="flex items-center gap-1">
              <NavLink href="/" icon={<Home className="h-5 w-5"/>}>Home</NavLink>
              <div className={cn("flex items-center gap-1 transition-opacity duration-200", isNavExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden')}>
                <NavLink href="/wall" icon={<MessageSquare className="h-5 w-5"/>} hidden={!showWall}>Wall</NavLink>
                {user && <NavLink href="/activity" icon={<Activity className="h-5 w-5"/>}>Activity</NavLink>}
                {canManage && <NavLink href="/manage" icon={<Shield className="h-5 w-5"/>}>Dashboard</NavLink>}
                {user && <NavLink href="/favorites" icon={<Heart className="h-5 w-5"/>}>Favorites</NavLink>}
                {user && <NavLink href={`/profile/${user.id}`} icon={<User className="h-5 w-5"/>}>Profile</NavLink>}
              </div>
            </nav>
          </motion.div>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-muted/50 backdrop-blur-sm" onClick={() => setIsNavExpanded(!isNavExpanded)}>
              <ChevronRight className={cn("h-4 w-4 transition-transform", isNavExpanded && "rotate-180")} />
          </Button>
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

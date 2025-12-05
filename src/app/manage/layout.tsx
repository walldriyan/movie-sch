'use client';

import { useSession } from 'next-auth/react';
import { notFound, usePathname } from 'next/navigation';
import { ROLES } from '@/lib/permissions';
import {
  LayoutGrid,
  List,
  Users,
  Users2,
  BookCheck,
  Bell,
  Settings,
  MessageSquareWarning,
  Shield,
  ChevronRight,
  Home,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '@/components/auth/auth-guard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  disabled?: boolean;
  badge?: string;
}

const NavItem = ({ href, icon: Icon, label, isActive, disabled, badge }: NavItemProps) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={disabled ? '#' : href}
          className={cn(
            "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            "hover:bg-white/5",
            isActive && "bg-gradient-to-r from-primary/20 to-primary/5 text-primary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            isActive
              ? "bg-primary/20 text-primary"
              : "bg-white/5 text-muted-foreground group-hover:text-foreground"
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <span className={cn(
            "flex-1 text-sm font-medium",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )}>
            {label}
          </span>
          {badge && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-full">
              {badge}
            </span>
          )}
          {isActive && (
            <ChevronRight className="h-4 w-4 text-primary" />
          )}
        </Link>
      </TooltipTrigger>
      {disabled && (
        <TooltipContent side="right">
          <p>Coming soon</p>
        </TooltipContent>
      )}
    </Tooltip>
  </TooltipProvider>
);

const NavSection = ({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
      {title}
    </p>
    {children}
  </div>
);

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen">
        {/* Sidebar Skeleton */}
        <div className="w-72 border-r border-white/5 bg-background/50 backdrop-blur-xl p-4">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="space-y-2 pt-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user || ![ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role)) {
    notFound();
  }

  const isActive = (path: string) => pathname === path || (path !== '/manage' && pathname.startsWith(path));
  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 border-r border-white/5 bg-background/80 backdrop-blur-xl z-30">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Dashboard</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-6 overflow-y-auto h-[calc(100%-8rem)]">
          {/* Content Management */}
          <NavSection title="Content">
            <AuthGuard requiredRole={ROLES.USER_ADMIN}>
              <NavItem
                href="/manage"
                icon={LayoutGrid}
                label="Posts"
                isActive={pathname === '/manage'}
              />
            </AuthGuard>
            <NavItem
              href="/manage/series"
              icon={List}
              label="Series"
              isActive={isActive('/manage/series')}
              disabled
              badge="Soon"
            />
          </NavSection>

          {/* Admin Section - Only for Super Admin */}
          {isSuperAdmin && (
            <NavSection title="Administration">
              <NavItem
                href="/admin/exams"
                icon={BookCheck}
                label="Exams"
                isActive={isActive('/admin/exams')}
              />
              <NavItem
                href="/admin/users"
                icon={Users}
                label="Users"
                isActive={isActive('/admin/users')}
              />
              <NavItem
                href="/admin/groups"
                icon={Users2}
                label="Groups"
                isActive={isActive('/admin/groups')}
              />
              <NavItem
                href="/admin/notifications"
                icon={Bell}
                label="Notifications"
                isActive={isActive('/admin/notifications')}
              />
              <NavItem
                href="/admin/feedback"
                icon={MessageSquareWarning}
                label="Feedback"
                isActive={isActive('/admin/feedback')}
              />
              <NavItem
                href="/admin/settings"
                icon={Settings}
                label="Settings"
                isActive={isActive('/admin/settings')}
              />
            </NavSection>
          )}
        </nav>

        {/* Footer - Back to Home */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/5 bg-background/80 backdrop-blur-xl">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/5">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 min-h-screen">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

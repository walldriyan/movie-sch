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
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '@/components/auth/auth-guard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  disabled?: boolean;
  badge?: string;
}

const NavItem = ({ href, icon: Icon, label, isActive, disabled, badge }: NavItemProps) => (
  <Link
    href={disabled ? '#' : href}
    className={cn(
      "group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
      "hover:bg-white/5",
      isActive && "bg-white text-black",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    <Icon className={cn(
      "h-[18px] w-[18px]",
      isActive ? "text-black" : "text-white/60 group-hover:text-white"
    )} />
    <span className={cn(
      "flex-1 text-sm font-medium",
      isActive ? "text-black" : "text-white/70 group-hover:text-white"
    )}>
      {label}
    </span>
    {badge && (
      <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-md">
        {badge}
      </span>
    )}
    {isActive && (
      <ChevronRight className="h-4 w-4 text-black" />
    )}
  </Link>
);

const NavSection = ({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
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
        <div className="w-64 border-r border-white/5 bg-background p-4">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <div className="space-y-2 pt-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
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
      {/* Sidebar - Suno.com Style */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-background z-40">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Dashboard</h2>
                <p className="text-xs text-white/50 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="px-4 pb-4">
          <Link href="/manage?create=true">
            <Button className="w-full rounded-md bg-white text-black hover:bg-white/90 gap-2 h-10">
              <Plus className="h-4 w-4" />
              Create New
            </Button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-4 overflow-y-auto h-[calc(100%-15rem)]">
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-3 hover:bg-white/5 text-white/60 hover:text-white rounded-md">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* Hero Section with Gradient */}
        <div className="relative">
          {/* Background Gradients */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute top-10 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
          </div>

          {/* Hero Content */}
          <div className="relative px-8 pt-8 pb-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    Welcome back, {user.name?.split(' ')[0] || 'Admin'}
                  </h1>
                  <p className="text-white/50 text-sm">
                    Manage your content, users, and settings from here.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/create">
                    <Button variant="outline" className="rounded-md border-white/10 hover:bg-white/5 text-white/70 hover:text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Quick Create
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

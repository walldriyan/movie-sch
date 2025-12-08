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
      "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 mx-3 mb-1",
      "border border-transparent",
      isActive
        ? "bg-white/10 text-white font-medium"
        : "text-muted-foreground hover:bg-white/5 hover:text-white",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    <Icon className={cn(
      "h-5 w-5 transition-transform duration-300",
      isActive ? "text-white scale-105" : "text-white/50 group-hover:text-white group-hover:scale-110"
    )} />
    <span className={cn(
      "flex-1 text-sm tracking-wide transition-all",
      isActive ? "text-white translate-x-1" : "text-white/70 group-hover:text-white group-hover:translate-x-1"
    )}>
      {label}
    </span>
    {badge && (
      <span className="px-2 py-0.5 text-[10px] font-bold bg-white/10 text-white rounded-full">
        {badge}
      </span>
    )}
    {isActive && (
      <ChevronRight className="h-4 w-4 text-white/50" />
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
  <div className="space-y-2 mb-6">
    <p className="px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 select-none">
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
      <div className="flex min-h-screen bg-[#0a0a0b]">
        {/* Sidebar Skeleton */}
        <div className="fixed left-4 top-4 bottom-4 w-64 rounded-3xl border border-white/5 bg-[#111112] p-4 hidden md:block">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full rounded-2xl bg-white/5" />
            <div className="space-y-3 pt-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="flex-1 md:ml-72 p-8">
          <Skeleton className="h-10 w-64 mb-8 bg-white/5" />
          <Skeleton className="h-[500px] w-full rounded-3xl bg-white/5" />
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
      {/* Sidebar - iPad OS Style (Floating, Rounded, No Shadow) */}
      <aside className="fixed left-4 top-4 bottom-4 w-64 rounded-[2rem] border border-white/[0.08] bg-[#111112] z-40 hidden md:flex flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-white/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white leading-tight">Dashboard</h2>
              <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
                {isSuperAdmin ? 'Super Admin' : 'Moderator'}
              </p>
            </div>
          </div>

          {/* Create Button */}
          <Link href="/manage?create=true">
            <Button className="w-full rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 text-white transition-all duration-300 h-12 gap-2 group mb-2 shadow-none hover:shadow-none">
              <div className="p-1 rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium tracking-wide">Create New</span>
            </Button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-0 py-2 space-y-2 no-scrollbar">
          {/* Content Management */}
          <NavSection title="Management">
            <AuthGuard requiredRole={ROLES.USER_ADMIN}>
              <NavItem
                href="/manage"
                icon={LayoutGrid}
                label="Content Posts"
                isActive={pathname === '/manage'}
              />
            </AuthGuard>
            <NavItem
              href="/manage/series"
              icon={List}
              label="Series Collections"
              isActive={isActive('/manage/series')}
              disabled
              badge="Soon"
            />
          </NavSection>

          {/* Admin Section - Only for Super Admin */}
          {isSuperAdmin && (
            <NavSection title="System">
              <NavItem
                href="/admin"
                icon={Shield}
                label="Admin Config"
                isActive={pathname === '/admin'}
              />
            </NavSection>
          )}
        </nav>

        {/* Footer - Back to Home (Styled like Homepage Sidebar) */}
        <div className="p-4 mt-auto border-t border-white/[0.05] bg-[#111112]">
          <Link
            href="/"
            className="group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/10"
          >
            <div className="p-1.5 rounded-full bg-white/5 text-white/50 group-hover:text-white group-hover:bg-white/20 transition-all">
              <Home className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                Back to Home
              </span>
              <span className="text-[10px] text-white/40 group-hover:text-white/60">
                Exit Dashboard
              </span>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-white/30 group-hover:text-white/60 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </aside>

      {/* Main Content - Adjusted Margin for Floating Sidebar */}
      <main className="flex-1 md:ml-72 min-h-screen transition-all duration-300">
        {/* Top Header / Hero */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-6 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {pathname === '/admin' ? 'System Administration' : 'Content Management'}
            </h1>
            <p className="text-muted-foreground text-sm">
              Welcome back, {user.name?.split(' ')[0]}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Online
            </div>
            <div className="h-10 w-10 rounded-full border border-white/10 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.image || '/placeholder.png'} alt="user" className="h-full w-full object-cover" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 md:p-8 max-w-[1920px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

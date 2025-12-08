'use client';

import {
    Home,
    User,
    Shield,
    Heart,
    MessageSquare,
    Activity,
    Compass,
    Film,
    Tv,
    Search,
    Plus,
    Bell,
    Menu,
    X,
    ChevronLeft,
    ChevronRight,
    Radio,
    LogOut
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ROLES } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { siteConfig } from '@/config/site.config';
import { Button } from '@/components/ui/button';
import UserButton from './user-button';
import CreateButton from './create-button';
import SearchBar from './search-bar';
import Image from 'next/image';

export default function LeftSidebar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const user = session?.user;
    const canManage = useMemo(() =>
        user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role),
        [user]
    );

    const isActive = useCallback((path: string) => pathname === path, [pathname]);

    // Hide sidebar on certain pages or when not logged in
    const shouldHideSidebar = useMemo(() => {
        const hiddenPaths = ['/login', '/register', '/admin', '/manage'];
        return hiddenPaths.some(p => pathname.startsWith(p));
    }, [pathname]);

    // Check if user is logged in
    const isLoggedIn = status === 'authenticated' && user;

    // Persist collapsed state
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved) setIsCollapsed(saved === 'true');
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    // Apply styles dynamically for non-logged in users and hidden sidebar
    useEffect(() => {
        const main = document.querySelector('main') as HTMLElement;
        if (!main) return;

        if (!isLoggedIn || shouldHideSidebar) {
            // No sidebar visible - reset margins
            main.style.marginLeft = '0';
            main.style.marginRight = '0';
            if (!isLoggedIn) {
                main.style.display = 'flex';
                main.style.justifyContent = 'center';
            } else {
                main.style.display = '';
                main.style.justifyContent = '';
            }
        } else {
            // Logged in with visible sidebar - apply sidebar margin
            // Increased margin to account for floating sidebar + gap
            const isMobile = window.innerWidth <= 768;
            main.style.marginLeft = isMobile ? '0' : (isCollapsed ? '110px' : '290px');
            main.style.display = '';
            main.style.justifyContent = '';
        }
    }, [isLoggedIn, isCollapsed, shouldHideSidebar]);

    if (!isLoggedIn) {
        return (
            <>
                <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
                    <div className="hidden md:block">
                        <SearchBar />
                    </div>
                    <Button asChild size="sm" className="h-8 text-xs rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/5 backdrop-blur-md">
                        <Link href="/auth">Login</Link>
                    </Button>
                </div>
            </>
        );
    }

    if (shouldHideSidebar) return null;

    const sidebarWidth = isCollapsed ? 'w-[80px]' : 'w-[250px]';

    // Cinematic NavItem with Dark Gray/iOS feel
    const NavItem = ({
        href,
        icon: Icon,
        label,
        show = true,
        badge,
    }: {
        href: string;
        icon: React.ElementType;
        label: string;
        show?: boolean;
        badge?: string;
    }) => {
        if (!show) return null;
        const active = isActive(href);

        return (
            <Link
                href={href}
                title={isCollapsed ? label : undefined}
                className={cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
                    "border border-transparent",
                    active
                        ? "bg-white/10 text-white shadow-sm"  // Brighter active state for dark gray bg
                        : "text-muted-foreground hover:bg-white/5 hover:text-white",
                    isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                )}
            >
                <Icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-300",
                    active ? "scale-110 text-white" : "group-hover:scale-110"
                )} />

                {!isCollapsed && (
                    <span className={cn(
                        "text-sm font-medium tracking-wide transition-all",
                        active ? "translate-x-1" : "group-hover:translate-x-1"
                    )}>
                        {label}
                    </span>
                )}

                {!isCollapsed && badge && (
                    <span className="ml-auto text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
                        {badge}
                    </span>
                )}
            </Link>
        );
    };

    // Group Label component
    const GroupLabel = ({ label }: { label: string }) => {
        if (isCollapsed) return <div className="h-6" />;
        return (
            <div className="px-4 mt-6 mb-2 text-[10px] uppercase tracking-[0.2em] font-bold text-white/30 select-none">
                {label}
            </div>
        );
    };

    return (
        <>
            {/* Top Right Controls */}
            <div className="fixed top-6 right-8 z-50 flex items-center gap-3">
                <div className="hidden md:block">
                    <SearchBar />
                </div>
                {canManage && <CreateButton />}
                <UserButton />
            </div>

            {/* Mobile menu button */}
            <button
                className="fixed top-4 left-4 z-50 md:hidden p-2.5 bg-zinc-900/80 backdrop-blur-md border border-white/10 text-white rounded-xl shadow-lg"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Floating Sidebar Container (iOS Style) */}
            <aside
                className={cn(
                    "fixed left-4 top-4 bottom-4 z-40 p-4 pb-6", // Floating positioning
                    "rounded-[2rem]", // High rounding
                    "bg-[#111112] border border-white/[0.08]", // Dark Gray / Zinc-900ish, very subtle border
                    "flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-300 cubic-bezier(0.25, 0.1, 0.25, 1)",
                    sidebarWidth,
                    mobileOpen ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
                )}
            >
                {/* Logo Area */}
                <div className={cn(
                    "flex items-center mb-8 pt-2",
                    isCollapsed ? "justify-center" : "justify-between px-2"
                )}>
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold shadow-lg group-hover:bg-white/20 transition-all">
                            {siteConfig.name.charAt(0)}
                        </div>
                        {!isCollapsed && (
                            <span className="text-xl font-bold tracking-tight text-white group-hover:text-white/80 transition-colors">
                                {siteConfig.name}
                            </span>
                        )}
                    </Link>
                    {!isCollapsed && (
                        <button
                            onClick={toggleCollapse}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {isCollapsed && (
                    <button
                        onClick={toggleCollapse}
                        className="mx-auto mb-6 w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}

                {/* User Profile Area (Floating Bubble) */}
                {user && !isCollapsed && (
                    <div className="mb-6 px-1">
                        <Link
                            href={`/profile/${user.id}`}
                            className="relative flex items-center gap-3 p-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                        >
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors">
                                <Image
                                    src={user.image || '/avatar-placeholder.png'}
                                    alt={user.name || 'User'}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-white group-hover:text-white/80 transition-colors max-w-[120px] truncate">
                                    {user.name}
                                </span>
                                <span className="text-[10px] text-white/40 uppercase tracking-wider">
                                    {user.role === 'SUPER_ADMIN' ? 'Admin' : 'Member'}
                                </span>
                            </div>
                            <ChevronRight className="ml-auto mr-2 w-3 h-3 text-white/30 group-hover:text-white/60 transition-colors" />
                        </Link>
                    </div>
                )}

                {user && isCollapsed && (
                    <div className="mb-6 flex justify-center">
                        <Link
                            href={`/profile/${user.id}`}
                            className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-white/30 transition-colors"
                        >
                            <Image
                                src={user.image || '/avatar-placeholder.png'}
                                alt={'User'}
                                fill
                                className="object-cover"
                            />
                        </Link>
                    </div>
                )}

                {/* Navigation Items */}
                <nav className="flex-1 space-y-2">
                    <NavItem href="/" icon={Home} label="Home" />
                    <NavItem href="/search" icon={Search} label="Search" />
                    {user && <NavItem href="/activity" icon={Activity} label="Activity" badge="New" />}

                    <GroupLabel label="Library" />
                    <div className="space-y-1">
                        <NavItem href="/movies" icon={Film} label="Movies" />
                        <NavItem href="/series" icon={Tv} label="Series" />
                        <NavItem href="/groups" icon={Radio} label="Groups" />
                        <NavItem href="/favorites" icon={Heart} label="Favorites" />
                    </div>
                </nav>

                {/* Bottom Section */}
                <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                    {canManage && (
                        <NavItem href="/manage" icon={Shield} label="Dashboard" badge="Admin" />
                    )}
                </div>

            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
        </>
    );
}

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

    // If user is not logged in, only show top controls, not sidebar
    if (!isLoggedIn) {
        return (
            <>
                {/* Top-right controls for non-logged users */}
                <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
                    <div className="hidden md:block">
                        <SearchBar />
                    </div>
                    <Button asChild size="sm" className="h-8 text-xs rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 hover:text-white">
                        <Link href="/login">Login</Link>
                    </Button>
                </div>
                {/* No sidebar = main content centered with no left margin */}
                <style jsx global>{`
                    main {
                        margin-left: 0 !important;
                        width: 100% !important;
                    }
                    .max-w-7xl {
                        margin-left: auto !important;
                        margin-right: auto !important;
                    }
                `}</style>
            </>
        );
    }

    if (shouldHideSidebar) return null;

    const sidebarWidth = isCollapsed ? 'w-[70px]' : 'w-[220px]';

    // Suno-style NavItem
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
                    "flex items-center gap-3 px-3 py-[6px] rounded transition-colors",
                    "hover:text-foreground",
                    active ? "text-foreground font-medium" : "text-muted-foreground",
                    isCollapsed && "justify-center px-2"
                )}
            >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!isCollapsed && (
                    <>
                        <span className="text-sm">{label}</span>
                        {badge && (
                            <span className="ml-auto text-[10px] bg-secondary text-foreground px-1.5 py-0.5 rounded text-xs">
                                {badge}
                            </span>
                        )}
                    </>
                )}
            </Link>
        );
    };

    // Group Label component
    const GroupLabel = ({ label }: { label: string }) => {
        if (isCollapsed) return <div className="h-3" />;
        return (
            <div className="px-3 pt-4 pb-1 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                {label}
            </div>
        );
    };

    return (
        <>
            {/* Absolute positioned top-right controls */}
            <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
                <div className="hidden md:block">
                    <SearchBar />
                </div>

                {canManage && <CreateButton />}

                {status === 'authenticated' && user ? (
                    <UserButton />
                ) : (
                    <Button asChild size="sm" className="h-8 text-xs">
                        <Link href="/login">Login</Link>
                    </Button>
                )}
            </div>

            {/* Mobile menu button */}
            <button
                className="fixed top-3 left-3 z-50 md:hidden p-2 hover:bg-secondary rounded"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 h-screen z-40 p-4",
                    "bg-background border-r border-border",
                    "flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-200",
                    sidebarWidth,
                    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Logo - SUNO style with arrow toggle */}
                <div className={cn(
                    "px-5 py-5 flex items-center",
                    isCollapsed ? "justify-center px-3" : "justify-between"
                )}>
                    <Link href="/" className="flex items-center">
                        {isCollapsed ? (
                            <span className="text-xl font-bold">{siteConfig.name.charAt(0)}</span>
                        ) : (
                            <span className="text-2xl font-bold tracking-tight">{siteConfig.name.toUpperCase()}</span>
                        )}
                    </Link>
                    {!isCollapsed && (
                        <button
                            onClick={toggleCollapse}
                            className="text-muted-foreground hover:text-foreground p-1"
                            title="Collapse sidebar"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Expand button when collapsed */}
                {isCollapsed && (
                    <button
                        onClick={toggleCollapse}
                        className="mx-auto mb-3 text-muted-foreground hover:text-foreground p-1"
                        title="Expand sidebar"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}

                {/* User Profile Area - at top like Suno */}
                {user && !isCollapsed && (
                    <div className="px-3 mb-4">
                        <Link
                            href={`/profile/${user.id}`}
                            className="flex items-center gap-3 px-2 py-2 rounded hover:bg-secondary/50 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm text-muted-foreground flex-1 truncate">{user.name || 'User'}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
                        </Link>
                    </div>
                )}

                {/* Collapsed user avatar */}
                {user && isCollapsed && (
                    <div className="px-2 mb-4 flex justify-center">
                        <Link
                            href={`/profile/${user.id}`}
                            title={user.name || 'Profile'}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white hover:opacity-80"
                        >
                            {user.name?.charAt(0) || 'U'}
                        </Link>
                    </div>
                )}

                {/* Main Navigation - with group labels, 5px gap */}
                <nav className="flex-1 px-1">
                    {/* Main Section */}
                    <div className="space-y-[5px]">
                        <NavItem href="/" icon={Home} label="Home" />
                        {user && <NavItem href="/create" icon={Plus} label="Create" />}
                        <NavItem href="/explore" icon={Compass} label="Explore" />
                        {user && <NavItem href="/wall" icon={MessageSquare} label="Wall" />}
                        <NavItem href="/search" icon={Search} label="Search" />
                    </div>

                    {/* Browse Section */}
                    <GroupLabel label="Browse" />
                    <div className="space-y-[5px]">
                        <NavItem href="/movies" icon={Film} label="Movies" />
                        <NavItem href="/series" icon={Tv} label="Series" />
                    </div>

                    {/* Library Section */}
                    {user && (
                        <>
                            <GroupLabel label="Library" />
                            <div className="space-y-[5px]">
                                <NavItem href="/favorites" icon={Heart} label="Favorites" />
                                <NavItem href="/activity" icon={Activity} label="Activity" />
                                <NavItem href="/notifications" icon={Bell} label="Notifications" />
                            </div>
                        </>
                    )}
                </nav>

                {/* ========== BOTTOM SECTION ========== */}
                <div className="mt-auto border-t border-border">
                    {/* Admin Dashboard - if admin */}
                    {canManage && (
                        <div className="px-1 py-2">
                            <Link
                                href="/manage"
                                title={isCollapsed ? "Dashboard" : undefined}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-[6px] rounded transition-colors",
                                    "hover:text-foreground",
                                    isActive('/manage') ? "text-foreground font-medium" : "text-muted-foreground",
                                    isCollapsed && "justify-center px-2"
                                )}
                            >
                                <Shield className="w-[18px] h-[18px] flex-shrink-0" />
                                {!isCollapsed && (
                                    <>
                                        <span className="text-sm flex-1">Dashboard</span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </>
                                )}
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Dynamic main content margin */}
            <style jsx global>{`
                main {
                    margin-left: ${isCollapsed ? '70px' : '220px'} !important;
                }
                @media (max-width: 768px) {
                    main {
                        margin-left: 0 !important;
                    }
                }
            `}</style>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
        </>
    );
}

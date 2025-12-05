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

    // Hide sidebar on certain pages
    const shouldHide = useMemo(() => {
        const hiddenPaths = ['/login', '/register', '/admin', '/manage'];
        return hiddenPaths.some(p => pathname.startsWith(p));
    }, [pathname]);

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

    if (shouldHide) return null;

    const sidebarWidth = isCollapsed ? 'w-[60px]' : 'w-[200px]';

    // Suno-style NavItem
    const NavItem = ({
        href,
        icon: Icon,
        label,
        show = true,
    }: {
        href: string;
        icon: React.ElementType;
        label: string;
        show?: boolean;
    }) => {
        if (!show) return null;
        const active = isActive(href);

        return (
            <Link
                href={href}
                title={isCollapsed ? label : undefined}
                className={cn(
                    "flex items-center gap-3 px-2 py-2 rounded transition-colors",
                    "hover:text-foreground",
                    active ? "text-foreground font-medium" : "text-muted-foreground",
                    isCollapsed && "justify-center"
                )}
            >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-[15px]">{label}</span>}
            </Link>
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
                    "fixed left-0 top-0 h-screen z-40",
                    "bg-background border-r border-border",
                    "flex flex-col overflow-y-auto transition-all duration-200",
                    sidebarWidth,
                    mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Logo - SUNO style with arrow toggle */}
                <div className={cn(
                    "px-3 py-4 flex items-center",
                    isCollapsed ? "justify-center" : "justify-between"
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

                {/* Main Navigation - grouped like Suno */}
                <nav className="flex-1 px-2">
                    {/* Group 1: Main */}
                    <div className="space-y-1">
                        <NavItem href="/" icon={Home} label="Home" />
                        {user && <NavItem href="/create" icon={Plus} label="Create" />}
                        <NavItem href="/explore" icon={Compass} label="Explore" />
                        {user && <NavItem href="/wall" icon={MessageSquare} label="Wall" />}
                    </div>

                    {/* Group 2: Content - with gap */}
                    <div className="space-y-1 mt-4">
                        <NavItem href="/movies" icon={Film} label="Movies" />
                        <NavItem href="/series" icon={Tv} label="Series" />
                        <NavItem href="/search" icon={Search} label="Search" />
                    </div>

                    {/* Group 3: User - with gap */}
                    {user && (
                        <div className="space-y-1 mt-4">
                            <NavItem href="/favorites" icon={Heart} label="Favorites" />
                            <NavItem href="/activity" icon={Activity} label="Activity" />
                            <NavItem href="/notifications" icon={Bell} label="Notifications" />
                        </div>
                    )}
                </nav>

                {/* ========== BOTTOM SECTION ========== */}
                <div className="mt-auto border-t border-border">
                    {/* Admin Dashboard - if admin */}
                    {canManage && (
                        <div className="px-2 py-2">
                            <Link
                                href="/manage"
                                title={isCollapsed ? "Dashboard" : undefined}
                                className={cn(
                                    "flex items-center gap-3 px-2 py-2 rounded transition-colors",
                                    "hover:text-foreground",
                                    isActive('/manage') ? "text-foreground font-medium" : "text-muted-foreground",
                                    isCollapsed && "justify-center"
                                )}
                            >
                                <Shield className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && (
                                    <>
                                        <span className="text-[15px] flex-1">Dashboard</span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </>
                                )}
                            </Link>
                        </div>
                    )}

                    {/* User Profile - AT THE VERY BOTTOM */}
                    {user && !isCollapsed && (
                        <div className="px-2 py-3 border-t border-border">
                            <Link
                                href={`/profile/${user.id}`}
                                className="flex items-center gap-3 px-2 py-2 rounded hover:bg-secondary/50 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                                <span className="text-[15px] text-muted-foreground flex-1 truncate">{user.name || 'User'}</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </Link>
                        </div>
                    )}

                    {/* Collapsed user avatar at bottom */}
                    {user && isCollapsed && (
                        <div className="px-2 py-3 flex justify-center border-t border-border">
                            <Link
                                href={`/profile/${user.id}`}
                                title={user.name || 'Profile'}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white hover:opacity-80"
                            >
                                {user.name?.charAt(0) || 'U'}
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Dynamic main content padding */}
            <style jsx global>{`
                main {
                    padding-left: ${isCollapsed ? '60px' : '200px'} !important;
                }
                @media (max-width: 768px) {
                    main {
                        padding-left: 0 !important;
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

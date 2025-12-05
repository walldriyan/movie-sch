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
    PanelLeftClose,
    PanelLeft,
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

    const sidebarWidth = isCollapsed ? 'w-[70px]' : 'w-[220px]';
    const mainPadding = isCollapsed ? '70px' : '220px';

    // Suno-style NavItem - medium bold font
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
                    "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                    "hover:bg-secondary",
                    active ? "text-foreground font-semibold bg-secondary" : "text-muted-foreground font-medium",
                    isCollapsed && "justify-center px-2"
                )}
            >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="text-[14px]">{label}</span>}
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
                style={{ '--sidebar-width': mainPadding } as React.CSSProperties}
            >
                {/* Logo - SUNO style */}
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
                            className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-secondary rounded"
                            title="Collapse sidebar"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Expand button when collapsed */}
                {isCollapsed && (
                    <button
                        onClick={toggleCollapse}
                        className="mx-auto mb-2 text-muted-foreground hover:text-foreground p-2 hover:bg-secondary rounded"
                        title="Expand sidebar"
                    >
                        <PanelLeft className="w-4 h-4" />
                    </button>
                )}

                {/* User Profile Area */}
                {user && !isCollapsed && (
                    <div className="px-2 py-2 border-b border-border mb-2">
                        <Link
                            href={`/profile/${user.id}`}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition-colors"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-semibold truncate block">{user.name || 'User'}</span>
                                <span className="text-xs text-muted-foreground">View profile</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                    </div>
                )}

                {/* Collapsed user avatar */}
                {user && isCollapsed && (
                    <div className="px-2 py-2 flex justify-center border-b border-border mb-2">
                        <Link
                            href={`/profile/${user.id}`}
                            title={user.name || 'Profile'}
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white hover:opacity-80"
                        >
                            {user.name?.charAt(0) || 'U'}
                        </Link>
                    </div>
                )}

                {/* Main Navigation */}
                <nav className="flex-1 px-2 py-2 space-y-1">
                    <NavItem href="/" icon={Home} label="Home" />

                    {user && (
                        <NavItem href="/create" icon={Plus} label="Create" />
                    )}

                    <NavItem href="/explore" icon={Compass} label="Explore" />

                    {user && (
                        <NavItem href="/wall" icon={MessageSquare} label="Wall" />
                    )}

                    {/* Browse Section */}
                    <div className="pt-4">
                        {!isCollapsed && (
                            <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                Browse
                            </div>
                        )}
                        <NavItem href="/movies" icon={Film} label="Movies" />
                        <NavItem href="/series" icon={Tv} label="Series" />
                        <NavItem href="/search" icon={Search} label="Search" />
                    </div>

                    {/* User Section */}
                    {user && (
                        <div className="pt-4">
                            {!isCollapsed && (
                                <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                    Library
                                </div>
                            )}
                            <NavItem href="/favorites" icon={Heart} label="Favorites" />
                            <NavItem href="/activity" icon={Activity} label="Activity" />
                            <NavItem href="/notifications" icon={Bell} label="Notifications" />
                        </div>
                    )}

                    {/* Admin Section */}
                    {canManage && (
                        <div className="pt-4">
                            {!isCollapsed && (
                                <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                                    Admin
                                </div>
                            )}
                            <NavItem href="/manage" icon={Shield} label="Dashboard" />
                        </div>
                    )}
                </nav>
            </aside>

            {/* Dynamic main content padding - CSS variable */}
            <style jsx global>{`
                main {
                    padding-left: ${isCollapsed ? '70px' : '220px'} !important;
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

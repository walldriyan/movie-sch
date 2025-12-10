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
    LogOut,
    Users,
    PanelLeftClose,
    PanelLeftOpen,
    Minimize2
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
import { getUserJoinedGroups } from '@/lib/actions/groups';
import { Separator } from '@/components/ui/separator';

export default function LeftSidebar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHidden, setIsHidden] = useState(false); // Default open, logo-only mode off
    const [userGroups, setUserGroups] = useState<{ id: string; name: string; profilePhoto: string | null }[]>([]);

    useEffect(() => {
        if (status === 'authenticated') {
            getUserJoinedGroups().then(setUserGroups).catch(console.error);
        }
    }, [status]);

    const user = session?.user;
    const canManage = useMemo(() =>
        user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role),
        [user]
    );

    const isActive = useCallback((path: string) => pathname === path, [pathname]);

    // Hide sidebar on certain pages or when not logged in
    const shouldHideSidebar = useMemo(() => {
        const hiddenPaths = ['/auth', '/register', '/admin', '/manage'];
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
            const isMobile = window.innerWidth <= 768;
            // If isHidden (logo only), margin is smaller (e.g. 100px so content doesn't hit logo) 
            // or maybe 0 if it floats over? Let's keep a small margin to respect the logo space.
            const margin = isHidden ? '90px' : (isCollapsed ? '130px' : '310px');
            main.style.marginLeft = isMobile ? '0' : margin;
            main.style.display = '';
            main.style.justifyContent = '';
        }
    }, [isLoggedIn, isCollapsed, shouldHideSidebar, isHidden]);

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

    // Dimensions based on state
    // Hidden: Small square for logo
    // Normal: Full height, variable width
    const sidebarWidth = isHidden ? 'w-[72px]' : (isCollapsed ? 'w-[80px]' : 'w-[250px]');
    const sidebarHeight = isHidden ? 'h-[72px]' : 'h-[calc(100vh-2rem)]';

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
        if (!show || isHidden) return null; // Don't render items if hidden
        const active = isActive(href);

        return (
            <Link
                href={href}
                title={isCollapsed ? label : undefined}
                className={cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                    "border border-transparent",
                    active
                        ? "bg-primary/10 text-primary font-medium shadow-sm border border-primary/10"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                )}
            >
                <Icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-300",
                    active ? "scale-110 text-primary" : "group-hover:scale-110"
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
        if (isCollapsed || isHidden) return <div className="h-0" />;
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
                className="fixed top-4 left-4 z-50 md:hidden p-2.5 bg-card/80 backdrop-blur-md border border-border/50 text-foreground rounded-xl shadow-lg"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Floating Sidebar Container (iOS Style) */}
            <aside
                className={cn(
                    "fixed left-4 top-4 z-40 transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1)", // Smooth spring-like transition
                    "rounded-2xl",
                    "bg-card/60 backdrop-blur-xl border border-border/40 shadow-xl",
                    "flex flex-col",
                    sidebarWidth,
                    // Height: Fit content but max screen height minus margins
                    isHidden ? "h-[72px]" : "h-auto max-h-[calc(100vh-2rem)]",
                    // If hidden, center content. If not, normal padding.
                    isHidden ? "items-center justify-center p-0 cursor-pointer hover:bg-white/5 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg" : "p-4 pb-6 overflow-y-auto overflow-x-hidden shadow-none",
                    mobileOpen ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
                )}
                onClick={(e) => {
                    // If hidden, click anywhere to expand
                    if (isHidden) {
                        setIsHidden(false);
                    }
                }}
            >

                {/* 1. HIDDEN MODE: JUST LOGO */}
                {isHidden && (
                    <div className="w-full h-full flex items-center justify-center group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
                            {siteConfig.name.charAt(0)}
                        </div>
                    </div>
                )}

                {/* 2. NORMAL MODE: FULL CONTENT */}
                {!isHidden && (
                    <>
                        {/* Logo Area */}
                        <div className={cn(
                            "flex items-center mb-8 pt-2",
                            isCollapsed ? "justify-center flex-col gap-4" : "justify-between px-2"
                        )}>
                            <Link href="/" className="flex items-center gap-2 group">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm border border-primary/20 group-hover:bg-primary/20 transition-all">
                                    {siteConfig.name.charAt(0)}
                                </div>
                                {!isCollapsed && (
                                    <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                        {siteConfig.name}
                                    </span>
                                )}
                            </Link>
                        </div>

                        {/* User Profile Area (Floating Bubble) */}
                        {user && !isCollapsed && (
                            <div className="mb-6 px-1">
                                <Link
                                    href={`/profile/${user.id}`}
                                    className="relative flex items-center gap-3 p-1.5 rounded-full bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-border/50 group-hover:border-primary/50 transition-colors">
                                        {user.image ? (
                                            <Image
                                                src={user.image}
                                                alt={user.name || 'User'}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors max-w-[120px] truncate">
                                            {user.name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                            {user.role === 'SUPER_ADMIN' ? 'Admin' : 'Member'}
                                        </span>
                                    </div>
                                    <ChevronRight className="ml-auto mr-2 w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                </Link>
                            </div>
                        )}

                        {user && isCollapsed && (
                            <div className="mb-6 flex justify-center">
                                <Link
                                    href={`/profile/${user.id}`}
                                    className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-white/30 transition-colors"
                                >
                                    {user.image ? (
                                        <Image
                                            src={user.image}
                                            alt={user.name || 'User'}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </Link>
                            </div>
                        )}

                        <nav className="flex-1 space-y-2">
                            <NavItem href="/" icon={Home} label="Home" />
                            <NavItem href="/search" icon={Search} label="Search" />

                            <GroupLabel label="Social" />
                            <NavItem
                                href={userGroups.length > 0 ? `/groups/${userGroups[0].id}` : "/groups"}
                                icon={Users}
                                label="Groups"
                            />

                            {user && (
                                <NavItem
                                    href="/activity"
                                    icon={Activity}
                                    label="Activity"
                                    badge="New"
                                />
                            )}
                        </nav>

                        {/* Bottom Section */}
                        <div className="mt-auto pt-6 border-t border-white/5 space-y-2">
                            {canManage && (
                                <NavItem href="/manage" icon={Shield} label="Dashboard" badge="Admin" />
                            )}

                            {/* Separator and Sidebar Controls */}
                            <Separator className="bg-white/5 my-2" />

                            <button
                                onClick={toggleCollapse}
                                className={cn(
                                    "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left",
                                    "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                    isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                                )}
                                title={isCollapsed ? "Expand" : "Collapse"}
                            >
                                {isCollapsed ? (
                                    <PanelLeftOpen className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                ) : (
                                    <PanelLeftClose className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                )}
                                {!isCollapsed && (
                                    <span className="text-sm font-medium tracking-wide">
                                        Collapse
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setIsHidden(true)}
                                className={cn(
                                    "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 w-full text-left",
                                    "text-muted-foreground hover:bg-red-500/10 hover:text-red-400",
                                    isCollapsed && "justify-center px-0 w-12 h-12 mx-auto"
                                )}
                                title="Hide Sidebar"
                            >
                                <Minimize2 className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                {!isCollapsed && (
                                    <span className="text-sm font-medium tracking-wide">
                                        Hide
                                    </span>
                                )}
                            </button>
                        </div>
                    </>
                )}

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

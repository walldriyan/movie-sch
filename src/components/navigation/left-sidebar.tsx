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
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ROLES } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import React, { useMemo, useCallback, useState } from 'react';
import { siteConfig } from '@/config/site.config';
import { Button } from '@/components/ui/button';
import UserButton from './user-button';
import CreateButton from './create-button';
import Image from 'next/image';

export default function LeftSidebar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

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

    if (shouldHide) return null;

    // Suno-style NavItem - horizontal icon + text
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
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                    "hover:bg-secondary",
                    active ? "text-foreground font-medium bg-secondary" : "text-muted-foreground"
                )}
            >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{label}</span>
                {badge && (
                    <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        {badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <>
            {/* Absolute positioned top-right controls */}
            <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
                {/* Search placeholder */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary rounded-md text-muted-foreground text-sm">
                    <span>Create your own content</span>
                </div>

                {canManage && <CreateButton />}

                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Search className="w-5 h-5" />
                </Button>

                {status === 'authenticated' && user ? (
                    <UserButton />
                ) : (
                    <Button asChild size="sm">
                        <Link href="/login">Login</Link>
                    </Button>
                )}
            </div>

            {/* Mobile menu button */}
            <button
                className="fixed top-4 left-4 z-50 md:hidden p-2 hover:bg-secondary rounded-md"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 h-screen w-[200px] z-40",
                "bg-background border-r border-border",
                "flex flex-col overflow-y-auto",
                // Mobile: hidden by default, shown when mobileOpen
                mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                "transition-transform duration-200"
            )}>
                {/* Logo */}
                <div className="p-4 flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Logo" width={28} height={28} />
                        <span className="font-bold text-lg">{siteConfig.name}</span>
                    </Link>
                    <button className="ml-auto text-muted-foreground hover:text-foreground">
                        <span className="text-lg">‹</span>
                    </button>
                </div>

                {/* User Profile Area */}
                {user && (
                    <div className="px-3 py-2">
                        <Link
                            href={`/profile/${user.id}`}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm font-medium truncate">{user.name || 'User'}</span>
                        </Link>
                    </div>
                )}

                {/* Main Navigation */}
                <nav className="flex-1 px-2 py-2 space-y-1">
                    <NavItem href="/" icon={Home} label="Home" />

                    {user && (
                        <>
                            <NavItem href="/create" icon={Plus} label="Create" badge="+" />
                        </>
                    )}

                    <NavItem href="/explore" icon={Compass} label="Explore" />

                    {user && (
                        <NavItem href="/wall" icon={MessageSquare} label="Wall" />
                    )}

                    {/* Content Section */}
                    <div className="pt-4">
                        <NavItem href="/movies" icon={Film} label="Movies" />
                        <NavItem href="/series" icon={Tv} label="Series" />
                        <NavItem href="/search" icon={Search} label="Search" />
                    </div>

                    {/* User Section */}
                    {user && (
                        <div className="pt-4">
                            <NavItem href="/favorites" icon={Heart} label="Favorites" />
                            <NavItem href="/activity" icon={Activity} label="Activity" />
                            <NavItem href="/notifications" icon={Bell} label="Notifications" />
                        </div>
                    )}

                    {/* Admin Section */}
                    {canManage && (
                        <div className="pt-4">
                            <NavItem href="/manage" icon={Shield} label="Dashboard" />
                        </div>
                    )}
                </nav>
            </aside>

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

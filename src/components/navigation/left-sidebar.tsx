'use client';

import { Button } from '@/components/ui/button';
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
    Loader2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ROLES } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import React, { useMemo, useTransition, useCallback, useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Cache session data to avoid re-checking on every render
let cachedUser: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

export default function LeftSidebar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    // Cache user data for 30 seconds to prevent repeated auth checks
    const user = useMemo(() => {
        const now = Date.now();
        if (session?.user) {
            cachedUser = session.user;
            cacheTimestamp = now;
            return session.user;
        }
        // Use cached user if within cache duration
        if (cachedUser && now - cacheTimestamp < CACHE_DURATION) {
            return cachedUser;
        }
        return null;
    }, [session?.user]);

    const canManage = useMemo(() =>
        user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role),
        [user]
    );

    // Clear navigation state when pathname changes
    useEffect(() => {
        setNavigatingTo(null);
    }, [pathname]);

    // Check if path is active
    const isActive = useCallback((path: string) => pathname === path, [pathname]);

    // Hide sidebar on certain pages
    const shouldHide = useMemo(() => {
        const hiddenPaths = ['/login', '/register', '/admin', '/manage'];
        return hiddenPaths.some(p => pathname.startsWith(p));
    }, [pathname]);

    if (shouldHide) return null;

    // NavItem component with Link for prefetching and instant navigation
    const NavItem = ({
        href,
        icon: Icon,
        label,
        show = true
    }: {
        href: string;
        icon: React.ElementType;
        label: string;
        show?: boolean;
    }) => {
        if (!show) return null;

        const active = isActive(href);
        const isNavigating = navigatingTo === href && isPending;

        return (
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href={href}
                            prefetch={true}
                            onClick={(e) => {
                                if (active) {
                                    e.preventDefault();
                                    return;
                                }
                                setNavigatingTo(href);
                                startTransition(() => {
                                    // Navigation happens via Link, transition just tracks state
                                });
                            }}
                            className={cn(
                                "w-full h-auto py-3 px-2 flex flex-col items-center justify-center gap-1 rounded-lg transition-all",
                                "hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                active && "bg-white/10 text-primary",
                                isNavigating && "opacity-70"
                            )}
                        >
                            {isNavigating ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            ) : (
                                <Icon className={cn("h-5 w-5", active && "text-primary")} />
                            )}
                            <span className={cn(
                                "text-[10px] font-medium leading-tight text-center",
                                active ? "text-primary" : "text-muted-foreground"
                            )}>
                                {label}
                            </span>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-zinc-800 text-white border-zinc-700">
                        {label}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <aside className={cn(
            "fixed left-0 top-16 h-[calc(100vh-4rem)] w-[72px] z-40",
            "bg-background/60 backdrop-blur-xl",
            "hidden md:flex flex-col items-center py-2"
        )}>
            {/* Main Navigation */}
            <nav className="flex flex-col items-center w-full space-y-1 px-2">
                <NavItem href="/" icon={Home} label="Home" />
                <NavItem href="/explore" icon={Compass} label="Explore" />

                {/* Wall - show for all logged in users */}
                {user && <NavItem href="/wall" icon={MessageSquare} label="Wall" />}

                {/* Divider */}
                <div className="w-8 h-px bg-white/10 my-2" />

                <NavItem href="/movies" icon={Film} label="Movies" />
                <NavItem href="/series" icon={Tv} label="Series" />

                {user && (
                    <>
                        {/* Divider */}
                        <div className="w-8 h-px bg-white/10 my-2" />

                        <NavItem href="/activity" icon={Activity} label="Activity" />
                        <NavItem href="/favorites" icon={Heart} label="Favorites" />
                        {canManage && (
                            <NavItem href="/manage" icon={Shield} label="Dashboard" />
                        )}
                    </>
                )}
            </nav>

            {/* Bottom section - Profile */}
            {user && (
                <div className="mt-auto pb-4 w-full px-2">
                    <div className="w-8 h-px bg-white/10 mx-auto mb-2" />
                    <NavItem
                        href={`/profile/${user.id}`}
                        icon={User}
                        label="You"
                    />
                </div>
            )}
        </aside>
    );
}

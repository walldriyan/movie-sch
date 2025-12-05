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
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useLoading } from '@/context/loading-context';
import { ROLES } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import React from 'react';
import { canUserAccessMicroPosts } from '@/lib/actions/users';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function LeftSidebar() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const { withLoading } = useLoading();
    const [showWall, setShowWall] = React.useState(false);
    const user = session?.user;
    const canManage = user && [ROLES.SUPER_ADMIN, ROLES.USER_ADMIN].includes(user.role);

    React.useEffect(() => {
        async function checkWallAccess() {
            if (status === 'authenticated') {
                const canAccess = await canUserAccessMicroPosts();
                setShowWall(canAccess);
            } else {
                setShowWall(false);
            }
        }
        checkWallAccess();
    }, [status]);

    const handleNavigation = (href: string) => {
        withLoading(async () => {
            router.push(href);
            await Promise.resolve();
        });
    };

    const isActive = (path: string) => pathname === path;

    // Hide sidebar on certain pages
    const hiddenPaths = ['/login', '/register', '/admin'];
    const shouldHide = hiddenPaths.some(p => pathname.startsWith(p));

    if (shouldHide) return null;

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

        return (
            <TooltipProvider delayDuration={100}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full h-auto py-3 px-2 flex flex-col items-center justify-center gap-1 rounded-lg transition-all",
                                "hover:bg-white/10",
                                active && "bg-white/10 text-primary"
                            )}
                            onClick={() => handleNavigation(href)}
                        >
                            <Icon className={cn("h-5 w-5", active && "text-primary")} />
                            <span className={cn(
                                "text-[10px] font-medium leading-tight text-center",
                                active ? "text-primary" : "text-muted-foreground"
                            )}>
                                {label}
                            </span>
                        </Button>
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
            "hidden md:flex flex-col items-center py-2",
            "shadow-[4px_0_15px_-3px_rgba(0,0,0,0.4)]"
        )}>
            {/* Main Navigation */}
            <nav className="flex flex-col items-center w-full space-y-1 px-2">
                <NavItem href="/" icon={Home} label="Home" />
                <NavItem href="/explore" icon={Compass} label="Explore" />
                <NavItem href="/wall" icon={MessageSquare} label="Wall" show={showWall} />

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

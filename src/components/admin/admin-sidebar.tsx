'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Megaphone,
    Package,
    Key,
    CreditCard,
    LayoutDashboard,
    Users,
    MessageSquare,
    Crown,
    Receipt,
    FolderKanban,
    Settings,
    Wallet,
    PanelLeftClose,
    PanelLeftOpen,
    Menu,
    X,
    LogOut,
    Home
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { siteConfig } from '@/config/site.config';
import { Button } from '@/components/ui/button';

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
    {
        title: 'Overview',
        items: [
            { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { title: 'Users', href: '/admin?tab=users', icon: Users },
            { title: 'Groups', href: '/admin?tab=groups', icon: FolderKanban },
            { title: 'Settings', href: '/admin?tab=settings', icon: Settings },
        ]
    },
    {
        title: 'Ads Management',
        items: [
            { title: 'All Ads', href: '/admin/ads', icon: Megaphone },
            { title: 'Ad Packages', href: '/admin/ads/packages', icon: Package },
            { title: 'Access Requests', href: '/admin/ads/requests', icon: Key, badge: 'New' },
            { title: 'Payment Codes', href: '/admin/ads/payments', icon: CreditCard },
        ]
    },
    {
        title: 'Subscriptions',
        items: [
            { title: 'Overview', href: '/admin/payments', icon: Wallet },
            { title: 'Subscribers', href: '/admin/payments?tab=subscriptions', icon: Crown },
            { title: 'Transactions', href: '/admin/payments?tab=transactions', icon: Receipt },
            { title: 'Requests', href: '/admin/payments?tab=requests', icon: Key },
        ]
    },
    {
        title: 'Communication',
        items: [
            { title: 'Messages', href: '/admin/messages', icon: MessageSquare },
        ]
    }
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Persist collapsed state
    useEffect(() => {
        const saved = localStorage.getItem('admin-sidebar-collapsed');
        if (saved) setIsCollapsed(saved === 'true');
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('admin-sidebar-collapsed', String(newState));

        // Dispatch event for layout to adjust
        window.dispatchEvent(new Event('resize'));
    };

    const isActive = (href: string) => {
        if (href === '/admin' && pathname === '/admin') return true;

        if (href.startsWith('/admin?')) {
            return pathname === '/admin' && href.includes('tab=');
        }

        return pathname === href || pathname.startsWith(href + '/');
    };

    // Handle Layout Resizing
    useEffect(() => {
        const handleResize = () => {
            const main = document.getElementById('admin-main-content');
            if (!main) return;

            const isMobile = window.innerWidth < 1024; // lg breakpoint
            if (isMobile) {
                main.style.marginLeft = '0';
            } else {
                // 16px (left) + 80px/260px (width) + 24px (gap)
                main.style.marginLeft = isCollapsed ? '120px' : '300px';
            }
        };

        // Initial call
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isCollapsed]);


    // Helper for determining if a tab is active
    // Ideally we use useSearchParams, but let's keep it simple visual matching
    const NavItemComponent = ({ item }: { item: NavItem }) => {
        const active = isActive(item.href);
        const Icon = item.icon;

        return (
            <Link
                href={item.href}
                title={isCollapsed ? item.title : undefined}
                className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                    "border border-transparent",
                    active
                        ? "bg-primary/10 text-primary font-medium shadow-sm border border-primary/10"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    isCollapsed && "justify-center px-0 w-10 h-10 mx-auto"
                )}
            >
                <Icon className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-300",
                    active ? "scale-110 text-primary" : "group-hover:scale-110"
                )} />

                {!isCollapsed && (
                    <span className={cn(
                        "text-sm font-medium tracking-wide transition-all truncate",
                        active ? "translate-x-1" : "group-hover:translate-x-1"
                    )}>
                        {item.title}
                    </span>
                )}

                {!isCollapsed && item.badge && (
                    <span className="ml-auto text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                        {item.badge}
                    </span>
                )}
            </Link>
        );
    };

    return (
        <>
            {/* Mobile menu button */}
            <button
                className="fixed top-4 left-4 z-50 lg:hidden p-2.5 bg-card/80 backdrop-blur-md border border-border/50 text-foreground rounded-xl shadow-lg"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed left-4 top-4 z-40 transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1)",
                    "rounded-2xl",
                    "bg-card/60 backdrop-blur-xl border border-border/40 shadow-xl",
                    "flex flex-col",
                    isCollapsed ? "w-[80px]" : "w-[260px]",
                    "h-[calc(100vh-2rem)]",
                    "pb-4 overflow-hidden", // Prevent scrollbar mess with rounded corners
                    mobileOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
                )}
            >
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">

                    {/* Header / Logo */}
                    <div className={cn(
                        "flex items-center mb-8 px-2",
                        isCollapsed ? "justify-center flex-col gap-4" : "justify-between"
                    )}>
                        <Link href="/admin" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
                                A
                            </div>
                            {!isCollapsed && (
                                <div className="flex flex-col">
                                    <span className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                        Admin
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                        Panel
                                    </span>
                                </div>
                            )}
                        </Link>
                    </div>

                    {/* Navigation Groups */}
                    <nav className="space-y-6">
                        {adminNavGroups.map((group) => (
                            <div key={group.title} className="space-y-1">
                                {!isCollapsed && (
                                    <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/50 select-none">
                                        {group.title}
                                    </div>
                                )}
                                {isCollapsed && (
                                    <div className="h-[1px] bg-white/5 mx-2 my-2" />
                                )}

                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <NavItemComponent key={item.href} item={item} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-white/5 bg-black/10 backdrop-blur-sm mt-auto">
                    <div className="space-y-1">
                        <Link
                            href="/"
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                                "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                isCollapsed && "justify-center px-0 w-10 h-10 mx-auto"
                            )}
                            title="Back to Site"
                        >
                            <Home className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            {!isCollapsed && (
                                <span className="text-sm font-medium tracking-wide">Back to Site</span>
                            )}
                        </Link>

                        <button
                            onClick={toggleCollapse}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 w-full text-left",
                                "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : ""
                            )}
                            title={isCollapsed ? "Expand" : "Collapse"}
                        >
                            {isCollapsed ? (
                                <PanelLeftOpen className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            ) : (
                                <PanelLeftClose className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            )}
                            {!isCollapsed && (
                                <span className="text-sm font-medium tracking-wide">Collapse</span>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}
        </>
    );
}

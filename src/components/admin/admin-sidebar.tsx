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
    ChevronRight,
    Settings,
    Wallet
} from 'lucide-react';

interface NavItem {
    title: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
}

interface NavGroup {
    title: string;
    icon: React.ReactNode;
    items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
    {
        title: 'Overview',
        icon: <LayoutDashboard className="h-4 w-4" />,
        items: [
            { title: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
            { title: 'Users', href: '/admin?tab=users', icon: <Users className="h-4 w-4" /> },
            { title: 'Groups', href: '/admin?tab=groups', icon: <FolderKanban className="h-4 w-4" /> },
            { title: 'Settings', href: '/admin?tab=settings', icon: <Settings className="h-4 w-4" /> },
        ]
    },
    {
        title: 'Ads Management',
        icon: <Megaphone className="h-4 w-4" />,
        items: [
            { title: 'All Ads', href: '/admin/ads', icon: <Megaphone className="h-4 w-4" /> },
            { title: 'Ad Packages', href: '/admin/ads/packages', icon: <Package className="h-4 w-4" /> },
            { title: 'Access Requests', href: '/admin/ads/requests', icon: <Key className="h-4 w-4" />, badge: 'New' },
            { title: 'Payment Codes', href: '/admin/ads/payments', icon: <CreditCard className="h-4 w-4" /> },
        ]
    },
    {
        title: 'Subscriptions',
        icon: <Crown className="h-4 w-4" />,
        items: [
            { title: 'Overview', href: '/admin/payments', icon: <Wallet className="h-4 w-4" /> },
            { title: 'Subscribers', href: '/admin/payments?tab=subscriptions', icon: <Crown className="h-4 w-4" /> },
            { title: 'Transactions', href: '/admin/payments?tab=transactions', icon: <Receipt className="h-4 w-4" /> },
            { title: 'Pending Requests', href: '/admin/payments?tab=requests', icon: <Key className="h-4 w-4" /> },
        ]
    },
    {
        title: 'Communication',
        icon: <MessageSquare className="h-4 w-4" />,
        items: [
            { title: 'Messages', href: '/admin/messages', icon: <MessageSquare className="h-4 w-4" /> },
        ]
    }
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const fullPath = typeof window !== 'undefined' ? window.location.href : pathname;

    const isActive = (href: string) => {
        if (href === '/admin' && pathname === '/admin' && !fullPath.includes('?')) {
            return true;
        }
        if (href.includes('?')) {
            return fullPath.includes(href);
        }
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] bg-[#0a0a0b] border-r border-white/5 fixed left-0 top-16 pt-6 pb-4 overflow-y-auto">
            <nav className="flex-1 px-3 space-y-6">
                {adminNavGroups.map((group) => (
                    <div key={group.title} className="space-y-1">
                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                            {group.icon}
                            {group.title}
                        </div>
                        <div className="space-y-0.5">
                            {group.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                        isActive(item.href)
                                            ? "bg-primary/10 text-primary border-l-2 border-primary"
                                            : "text-white/60 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <span className={cn(
                                        isActive(item.href) ? "text-primary" : "text-white/40"
                                    )}>
                                        {item.icon}
                                    </span>
                                    <span className="flex-1">{item.title}</span>
                                    {item.badge && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary rounded">
                                            {item.badge}
                                        </span>
                                    )}
                                    {isActive(item.href) && (
                                        <ChevronRight className="h-4 w-4 text-primary" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/5 mt-auto">
                <p className="text-xs text-white/30 text-center">
                    Admin Panel v2.0
                </p>
            </div>
        </aside>
    );
}

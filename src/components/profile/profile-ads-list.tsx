'use client';

import { useState, useEffect } from 'react';
import { SponsoredPost, AdPayment } from '@prisma/client';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, MousePointer2, Plus, Calendar, TrendingUp, CreditCard, LayoutGrid } from 'lucide-react';
import { toggleUserAdStatus, deleteSponsoredPost } from '@/lib/actions/ads';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateAdWizard from './create-ad-wizard';

type AdWithPayment = SponsoredPost & { payment: AdPayment | null };

export default function ProfileAdsList({ ads, isOwnProfile }: { ads: AdWithPayment[], isOwnProfile: boolean }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    // Determine initial tab from URL or default
    const initialTab = searchParams.get('action') === 'create' ? 'create' : 'overview';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync state with URL param changes - ONLY depend on searchParams, not activeTab
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'create') {
            setActiveTab('create');
        } else if (action === 'payments') {
            setActiveTab('payments');
        } else if (!action) {
            setActiveTab('overview');
        }
    }, [searchParams]); // Removed activeTab to prevent infinite loop

    const handleTabChange = (val: string) => {
        setActiveTab(val);
        // Optional: Update URL without full refresh to keep bookmarkable state
        const newParams = new URLSearchParams(searchParams.toString());
        if (val === 'overview') newParams.delete('action');
        else newParams.set('action', val);
        router.push(`?${newParams.toString()}`, { scroll: false });
    };

    // Derived Stats
    const totalViews = ads.reduce((acc, ad) => acc + ad.views, 0);
    const totalClicks = ads.reduce((acc, ad) => acc + ad.clicks, 0);
    const activeAdsCount = ads.filter(ad => ad.isActive && ad.status === 'APPROVED').length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Ad Center</h2>
                    <p className="text-white/50 text-sm">Manage your campaigns and view performance.</p>
                </div>

                {isOwnProfile && (
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full md:w-auto">
                        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl w-full md:w-auto grid grid-cols-3 md:flex">
                            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                                <LayoutGrid className="w-4 h-4 mr-2" />
                                Ads
                            </TabsTrigger>
                            <TabsTrigger value="create" className="rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white text-white/60">
                                <Plus className="w-4 h-4 mr-2" />
                                Create
                            </TabsTrigger>
                            <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Finance
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}
            </div>

            {/* Content Views */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                    {/* Quick Stats Row */}
                    {isOwnProfile && ads.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
                                    <Eye className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs uppercase font-bold tracking-wider">Total Views</p>
                                    <p className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                <div className="p-3 rounded-full bg-green-500/10 text-green-400">
                                    <MousePointer2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs uppercase font-bold tracking-wider">Total Clicks</p>
                                    <p className="text-2xl font-bold text-white">{totalClicks.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                <div className="p-3 rounded-full bg-purple-500/10 text-purple-400">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs uppercase font-bold tracking-wider">Active Campaigns</p>
                                    <p className="text-2xl font-bold text-white">{activeAdsCount}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!ads || ads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/20">
                                <LayoutGrid className="w-8 h-8" />
                            </div>
                            <div className="text-xl font-bold mb-2">No Ads Found</div>
                            <p className="text-muted-foreground max-w-sm mb-6 px-4">
                                {isOwnProfile ? "You haven't launched any ad campaigns yet. Start promoting your content today!" : "This user hasn't posted any ads."}
                            </p>
                            {isOwnProfile && (
                                <Button onClick={() => handleTabChange('create')} className="bg-white text-black hover:bg-white/90">
                                    Create Your First Ad
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {ads.map(ad => <AdItem key={ad.id} ad={ad} isOwnProfile={isOwnProfile} />)}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'create' && isOwnProfile && (
                <div className="animate-in zoom-in-95 duration-300">
                    <CreateAdWizard
                        onCancel={() => handleTabChange('overview')}
                        onSuccess={() => handleTabChange('overview')}
                    />
                </div>
            )}

            {activeTab === 'payments' && isOwnProfile && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Transaction History</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-white/40 uppercase bg-white/5 border-b border-white/5">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Date</th>
                                        <th className="px-4 py-3">Campaign</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Duration</th>
                                        <th className="px-4 py-3 rounded-tr-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {ads.filter(a => a.payment).length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-white/30">No payment history available.</td>
                                        </tr>
                                    ) : (
                                        ads.filter(a => a.payment).map(ad => (
                                            <tr key={ad.payment!.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-white/70">{new Date(ad.payment!.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 font-medium text-white">{ad.title}</td>
                                                <td className="px-4 py-3 text-white">{ad.payment!.currency} {ad.payment!.amount}</td>
                                                <td className="px-4 py-3 text-white/70">{ad.payment!.durationDays} Days</td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-xs font-bold">
                                                        PAID
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdItem({ ad, isOwnProfile }: { ad: AdWithPayment, isOwnProfile: boolean }) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isActive, setIsActive] = useState(ad.isActive);

    const expiryDate = ad.payment ? new Date(new Date(ad.createdAt).getTime() + ad.payment.durationDays * 24 * 60 * 60 * 1000) : null;
    const isExpired = expiryDate ? new Date() > expiryDate : false;

    // Calculate progress based on duration
    const progress = expiryDate ? Math.min(100, Math.max(0, ((Date.now() - new Date(ad.createdAt).getTime()) / (expiryDate.getTime() - new Date(ad.createdAt).getTime())) * 100)) : 100;

    const handleToggle = async (checked: boolean) => {
        if (!isOwnProfile) return;
        if (ad.status !== 'APPROVED') {
            toast({ title: "Action Required", description: "Wait for admin approval.", variant: "destructive" });
            return;
        }
        if (isExpired) {
            toast({ title: "Expired", description: "This ad has expired.", variant: "destructive" });
            return;
        }

        setLoading(true);
        // Optimistic
        setIsActive(checked);

        try {
            const res = await toggleUserAdStatus(ad.id);
            if (!res.success) {
                setIsActive(!checked); // Revert
                toast({ title: "Error", description: res.error as string, variant: "destructive" });
            } else {
                toast({ title: checked ? "Ad Enabled" : "Ad Disabled", description: "Status updated.", className: "bg-green-500 text-white border-none" });
                router.refresh();
            }
        } catch (e) {
            setIsActive(!checked);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this ad? This action cannot be undone.')) return;
        setIsDeleting(true);
        try {
            const res = await deleteSponsoredPost(ad.id);
            if (res.success) {
                toast({ title: "Deleted", description: "Ad removed successfully." });
                router.refresh();
            } else {
                toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="group bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-white/20 transition-all duration-300 shadow-xl relative">
            <div className="relative h-40 w-full bg-black/50 overflow-hidden">
                {ad.imageUrl ? (
                    <Image
                        src={ad.imageUrl}
                        alt={ad.title}
                        fill
                        className={cn("object-cover transition-transform duration-500", isActive ? "grayscale-0 group-hover:scale-105" : "grayscale opacity-50")}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
                )}
                <div className="absolute top-3 right-3 shadow-lg flex gap-2 z-10">
                    <StatusBadge status={ad.status} />
                </div>
                {/* Overlay Statuses */}
                {(!isActive && ad.status === 'APPROVED') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] z-0">
                        <span className="font-bold text-white uppercase tracking-widest border border-white/50 px-2 py-1 text-xs rounded bg-black/40 backdrop-blur-sm">Paused</span>
                    </div>
                )}
                {isExpired && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-[2px] z-20">
                        <span className="font-bold text-red-500 uppercase tracking-widest border border-red-500/50 p-2 rounded bg-black/60">Expired</span>
                    </div>
                )}

                {/* Duration Progress Bar */}
                {expiryDate && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                        <div className="h-full bg-purple-500" style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="mb-3">
                    <h3 className="font-bold text-base text-white line-clamp-1 mb-1">{ad.title}</h3>
                    <p className="text-xs text-white/60 line-clamp-2 h-8">{ad.description || 'No description provided.'}</p>
                </div>

                {expiryDate && (
                    <div className="flex items-center gap-2 text-[10px] text-white/40 mb-4 bg-white/5 p-1.5 rounded-lg border border-white/5">
                        <Calendar className="w-3 h-3" />
                        <span>Expires: {expiryDate.toLocaleDateString()}</span>
                    </div>
                )}

                <div className="mt-auto space-y-3">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5 group-hover:bg-white/10 transition-colors">
                            <span className="block text-lg font-bold text-white">{ad.views}</span>
                            <span className="text-[10px] uppercase text-white/40 font-bold">Views</span>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5 group-hover:bg-white/10 transition-colors">
                            <span className="block text-lg font-bold text-white">{ad.clicks}</span>
                            <span className="text-[10px] uppercase text-white/40 font-bold">Clicks</span>
                        </div>
                    </div>

                    {/* Controls */}
                    {isOwnProfile && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDelete}
                                disabled={loading || isDeleting}
                                className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
                            >
                                {isDeleting ? "..." : "Delete"}
                            </Button>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-white/50 uppercase">
                                    {isActive ? "On" : "Off"}
                                </span>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={handleToggle}
                                    disabled={!isOwnProfile || ad.status !== 'APPROVED' || loading || isExpired}
                                    className="scale-75 origin-right data-[state=checked]:bg-green-500"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'APPROVED') return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-2 py-0 text-[10px] shadow-sm shadow-green-900/20">Approved</Badge>;
    if (status === 'REJECTED') return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-2 py-0 text-[10px] shadow-sm shadow-red-900/20">Rejected</Badge>;
    return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 px-2 py-0 text-[10px] shadow-sm shadow-yellow-900/20">Pending</Badge>;
}

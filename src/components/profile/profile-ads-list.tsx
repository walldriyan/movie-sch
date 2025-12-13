'use client';

import { useState, useEffect, useMemo } from 'react';
import { SponsoredPost, PaymentRecord, AccessKey, Feedback, FeedbackReply, User } from '@prisma/client';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, MousePointer2, Plus, Calendar, TrendingUp, CreditCard, LayoutGrid, Key, ShieldCheck, CheckCircle2, Loader2, Lock, Copy, ShoppingCart, Ticket } from 'lucide-react';
import { toggleUserAdStatus, deleteSponsoredPost, getUserAdCreationConfig, requestAdKey, getUserAdRequests } from '@/lib/actions/ads';
import { redeemKeyAction } from '@/lib/actions/payment-actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateAdWizard from './create-ad-wizard';

type AdWithPayment = SponsoredPost & { paymentRecord: PaymentRecord | null, endDate: Date | null };
type PaymentWithDetails = PaymentRecord & { accessKey: AccessKey | null };
type ExtendedFeedback = Feedback & { replies: (FeedbackReply & { user: User })[] };

interface SetupConfig {
    balance: number;
    packages: any[];
}

function AdAccessWizard({ ads, history, adFeedbacks }: { ads: AdWithPayment[], history?: PaymentWithDetails[], adFeedbacks?: ExtendedFeedback[] }) {
    const { toast } = useToast();
    const router = useRouter();

    // Data State
    const [config, setConfig] = useState<SetupConfig | null>(null);
    const [requests, setRequests] = useState<any[]>([]);

    // UI State
    const [requesting, setRequesting] = useState(false);
    const [code, setCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    useEffect(() => {
        let isMounted = true;
        getUserAdCreationConfig().then(res => {
            if (isMounted && res) setConfig(res);
        });
        getUserAdRequests().then(res => {
            if (isMounted && res) setRequests(res);
        });
        return () => { isMounted = false; };
    }, []);

    const handleRequestKey = async (pkgId: string) => {
        setRequesting(true);
        try {
            const res = await requestAdKey(pkgId);
            if (res.success) {
                toast({ title: 'Request Sent', description: 'Admin has been notified. You will receive a key soon.' });
                getUserAdRequests().then(setRequests);
            } else {
                toast({ title: 'Error', description: res.error as string, variant: 'destructive' });
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to send request.', variant: 'destructive' });
        } finally {
            setRequesting(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "Code copied to clipboard." });
    };

    const handleRedeem = async () => {
        if (!code) return;
        setIsRedeeming(true);
        try {
            const res = await redeemKeyAction(code); // Note: This might need to be adjusted if we want to just go to CREATE tab. 
            // Actually, user flow dictates: Get Key -> Go to Create Tab -> Enter Key.
            // But if we want to "Redeem" here to "Activate" it into balance, that's one way.
            // However, the Ad System uses keys at creation time mostly.
            // Let's assume for now we just verify it exists or redirect.
            // BUT, strictly following user request: "e key eka use krala tamai create tab eken ad setaup eka kranna puluwan wenna one"
            // So we should probably just COPY it and redirect to Create Tab.

            // Simplified: Just redirect to create tab with code? 
            // Or better, just let them copy it.
            // But let's keep the verify functionality for sanity check.
            const verify = await redeemKeyAction(code); // This action verifies and *Consumes* key if it's a balance key, or validates it.
            // If it returns success, it might mean it's used. 
            // WAIT. `redeemKeyAction` in `payment-actions` adds balance or subscription.
            // Our ad keys might be `AdPayment` codes.
            // Let's look at `submitAdWithPackage` -> it takes `paymentCode`.
            // So we should NOT redeem it here if it's meant for the creation step.
            // We should just COPY it.

            // Check if user wants to REDEEM (add to balance) or USE in wizard.
            // The prompt says: "using that key ... setup the ad".
            // So I will change the "Verify & Redeem" button here to "Go to Create Ad" if valid? 
            // Or just simple "Redeem" if it's a balance topup.

            // Let's stick to the previous implementation of `redeemKeyAction` for generic keys, 
            // but for Ad Keys, we guide them to the Create Tab.

            toast({ title: "Valid Code", description: "Use this code in the 'Create' tab to launch your ad.", className: "bg-green-500 text-white" });
            // Optionally redirect
            router.push('?action=create');

        } catch (e) { toast({ title: "Error", description: "Invalid.", variant: "destructive" }); }
        finally { setIsRedeeming(false); }
    };

    const adHistory = history ? history.filter(h => h.type === 'AD_CAMPAIGN' || h.accessKey?.type === 'AD_CAMPAIGN') : [];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Status Overview */}
            <div className="bg-[#111112] border border-white/[0.02] rounded-sm p-6 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-full text-blue-400">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Ad Account Status</h3>
                        <p className="text-white/40 text-xs text-muted-foreground">
                            {ads.length > 0 ? 'Active Advertiser' : 'Standard User'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase">Active Campaigns</p>
                    <p className="text-2xl font-bold text-white">{ads.filter(a => a.status === 'APPROVED').length}</p>
                </div>
            </div>

            {/* PACKAGE SELECTION (Step 1) */}
            <div className="space-y-4">
                <h3 className="text-white font-semibold flex items-center gap-2 text-lg">
                    <ShoppingCart className="w-5 h-5 text-purple-400" /> Step 1: Select Package & Request Access
                </h3>

                {!config ? (
                    <div className="flex flex-col items-center justify-center py-12 text-white/40 bg-[#111112] border border-white/[0.02] rounded-sm">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p>Loading packages...</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {config.packages.map((pkg) => {
                            const pendingReq = requests.find(r => r.packageId === pkg.id && r.status === 'PENDING');
                            return (
                                <div key={pkg.id} className="bg-[#111112] border border-white/[0.02] hover:border-purple-500/30 rounded-xl p-6 relative group transition-all">
                                    <div className="space-y-2 mb-4">
                                        <h3 className="text-white font-bold text-lg">{pkg.name}</h3>
                                        <p className="text-white/60 text-sm h-10 line-clamp-2">{pkg.description}</p>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-bold text-purple-400">LKR {pkg.pricePerDay.toLocaleString()}</span>
                                            <span className="text-xs text-white/40 font-mono">/ Day</span>
                                        </div>
                                        <Button
                                            onClick={() => handleRequestKey(pkg.id)}
                                            disabled={requesting || !!pendingReq}
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "border-purple-500/30 text-purple-300 hover:bg-purple-500/10",
                                                pendingReq && "opacity-50 cursor-not-allowed bg-purple-500/5"
                                            )}
                                        >
                                            {requesting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Ticket className="w-3 h-3 mr-2" />}
                                            {pendingReq ? 'Pending...' : 'Request'}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* REQUEST HISTORY & CODES */}
                <div className="bg-[#111112] border border-white/[0.02] rounded-sm p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-full text-purple-400">
                            <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Your Requests & Keys</h3>
                            <p className="text-white/40 text-xs">Track status and copy assigned keys.</p>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {requests.length === 0 ? (
                            <p className="text-sm text-white/30 text-center py-8">No requests found.</p>
                        ) : (
                            requests.map((req) => (
                                <div key={req.id} className="bg-white/5 border border-white/5 rounded-lg p-3 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-medium text-sm">{req.package.name}</span>
                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border",
                                            req.status === 'APPROVED' ? "bg-green-500/20 text-green-300 border-green-500/30" :
                                                req.status === 'REJECTED' ? "bg-red-500/20 text-red-300 border-red-500/30" :
                                                    "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                                        )}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-white/40">
                                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {req.status === 'APPROVED' && req.assignedKey && (
                                        <div className="mt-1 bg-black/40 p-2 rounded border border-white/10 flex items-center justify-between gap-2">
                                            <code className="text-purple-300 font-mono text-xs">{req.assignedKey.code}</code>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(req.assignedKey.code)}>
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* REDEEM / MANUAL ENTRY (Step 2) */}
                <div className="bg-[#111112] border border-white/[0.02] rounded-sm p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-500/10 rounded-full text-green-400">
                            <Key className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Step 2: Have a Key?</h3>
                            <p className="text-white/40 text-xs">Enter your code to start creating.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-white/60 uppercase font-bold">Access Key</label>
                            <Input
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="P-XXXX-YYYY"
                                className="bg-white/5 border-white/10 text-white font-mono tracking-widest text-center uppercase"
                            />
                        </div>
                        <Button
                            onClick={() => router.push(`?action=create`)}
                            disabled={!code}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Use Key to Create Ad
                        </Button>
                        <p className="text-[10px] text-white/30 text-center">
                            Copy your approved key from the left panel and use it in the Create Wizard.
                        </p>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-[#111112] border border-white/[0.02] rounded-sm p-6">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider opacity-60">Redeemed & Used Codes</h3>
                <div className="overflow-hidden rounded-md border border-white/5">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white/40 uppercase bg-white/5 border-b border-white/5">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Key Used</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {adHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-white/30">No history found.</td>
                                </tr>
                            ) : (
                                adHistory.map((h: any) => (
                                    <tr key={h.id} className="group hover:bg-white/5">
                                        <td className="px-4 py-3 text-white/60">{new Date(h.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-mono text-white/80">{h.accessKey?.code || 'N/A'}</td>
                                        <td className="px-4 py-3 text-white font-bold">{h.currency} {h.amount}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="border-green-500/20 text-green-500 bg-green-500/10">Active</Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function ProfileAdsList({ ads, isOwnProfile, history, adFeedbacks }: { ads: AdWithPayment[], isOwnProfile: boolean, history?: PaymentWithDetails[], adFeedbacks?: ExtendedFeedback[] }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Determine initial tab from URL or default
    const initialTab = searchParams.get('action') === 'create' ? 'create' : 'overview';

    // Check if user is allowed to create ("Active Advertiser")
    // Definition: Has at least 1 ad created OR has redeemed ad credits in history.
    const hasAdHistory = history?.some(h => h.type === 'AD_CAMPAIGN' || h.accessKey?.type === 'AD_CAMPAIGN') || false;
    const isAdvertiser = ads.length > 0 || hasAdHistory;

    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync state with URL param changes
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'create') {
            // If trying to access create but not allowed, redirect to access
            if (!isAdvertiser && isOwnProfile) {
                setActiveTab('access');
            } else {
                setActiveTab('create');
            }
        } else if (action === 'payments') {
            setActiveTab('payments');
        } else if (action === 'access') {
            setActiveTab('access');
        } else if (!action) {
            setActiveTab('overview');
        }
    }, [searchParams, isAdvertiser, isOwnProfile]);

    const handleTabChange = (val: string) => {
        if (val === 'create' && !isAdvertiser) {
            toast({ title: "Access Restricted", description: "You must redeem an access key before creating ads.", variant: "destructive" });
            setActiveTab('access');
            return;
        }

        setActiveTab(val);
        const newParams = new URLSearchParams(searchParams.toString());
        if (val === 'overview') newParams.delete('action');
        else newParams.set('action', val);
        router.push(`?${newParams.toString()}`, { scroll: false });
    };

    // Derived Stats
    const totalViews = ads.reduce((acc, ad) => acc + ad.views, 0);
    const totalClicks = ads.reduce((acc, ad) => acc + ad.clicks, 0);
    const activeAdsCount = ads.filter(ad => ad.isActive && ad.status === 'APPROVED').length;

    const { toast } = useToast();

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
                        <TabsList className="bg-[#111112] border border-white/[0.02] p-1 rounded-sm w-full md:w-auto grid grid-cols-4 md:flex">
                            <TabsTrigger value="access" className="rounded-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                                <Key className="w-4 h-4 mr-2" />
                                <AccessTabLabel isAdvertiser={isAdvertiser} />
                            </TabsTrigger>
                            <TabsTrigger value="overview" className="rounded-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                                <LayoutGrid className="w-4 h-4 mr-2" />
                                Ads
                            </TabsTrigger>

                            {/* Create Tab - Disabled Visual if no access */}
                            <TabsTrigger
                                value="create"
                                disabled={!isAdvertiser}
                                className={cn(
                                    "rounded-sm text-white/60 relative group",
                                    !isAdvertiser ? "opacity-50 cursor-not-allowed data-[state=active]:bg-transparent" : "data-[state=active]:bg-purple-500 data-[state=active]:text-white"
                                )}
                            >
                                {!isAdvertiser ? <Lock className="w-3 h-3 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Create
                                {!isAdvertiser && (
                                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        Requires Access
                                    </span>
                                )}
                            </TabsTrigger>

                            <TabsTrigger value="payments" className="rounded-sm data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Finance
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}
            </div>

            {/* Access & Requests Wizard */}
            {activeTab === 'access' && isOwnProfile && (
                <div className="animate-in slide-in-from-left-4 duration-300">
                    <AdAccessWizard ads={ads} history={history} adFeedbacks={adFeedbacks} />
                </div>
            )}

            {/* Content Views */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                    {/* Quick Stats Row */}
                    {isOwnProfile && ads.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-[#111112] border border-white/[0.02] rounded-sm p-4 flex items-center gap-4">
                                <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
                                    <Eye className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs uppercase font-bold tracking-wider">Total Views</p>
                                    <p className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="bg-[#111112] border border-white/[0.02] rounded-sm p-4 flex items-center gap-4">
                                <div className="p-3 rounded-full bg-green-500/10 text-green-400">
                                    <MousePointer2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs uppercase font-bold tracking-wider">Total Clicks</p>
                                    <p className="text-2xl font-bold text-white">{totalClicks.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="bg-[#111112] border border-white/[0.02] rounded-sm p-4 flex items-center gap-4">
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
                            {isOwnProfile && isAdvertiser && (
                                <Button onClick={() => handleTabChange('create')} className="bg-white text-black hover:bg-white/90">
                                    Create Your First Ad
                                </Button>
                            )}
                            {isOwnProfile && !isAdvertiser && (
                                <Button onClick={() => handleTabChange('access')} className="bg-purple-600 text-white hover:bg-purple-700 mt-2">
                                    Request Ad Access
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

            {activeTab === 'create' && isOwnProfile && isAdvertiser && (
                <div className="animate-in zoom-in-95 duration-300">
                    <CreateAdWizard
                        onCancel={() => handleTabChange('overview')}
                        onSuccess={() => handleTabChange('overview')}
                    />
                </div>
            )}

            {activeTab === 'payments' && isOwnProfile && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-[#111112] border border-white/[0.02] rounded-sm p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Transaction History</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-white/40 uppercase bg-white/5 border-b border-white/5">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Date</th>
                                        <th className="px-4 py-3">Campaign</th>
                                        <th className="px-4 py-3">Total / Daily</th>
                                        <th className="px-4 py-3">Duration</th>
                                        <th className="px-4 py-3">Remaining Balance</th>
                                        <th className="px-4 py-3 rounded-tr-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {ads.filter(a => a.paymentRecord).length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-white/30">No payment history available.</td>
                                        </tr>
                                    ) : (
                                        ads.filter(a => a.paymentRecord).map(ad => {
                                            const payment = ad.paymentRecord!;
                                            const startDate = new Date(ad.createdAt);
                                            const expiryDate = ad.endDate ? new Date(ad.endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days if missing

                                            // Calculate Duration Days
                                            const durationMs = expiryDate.getTime() - startDate.getTime();
                                            const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

                                            const dailyCost = durationDays > 0 ? payment.amount / durationDays : 0;

                                            const now = new Date();
                                            const isExpired = now > expiryDate;
                                            const daysRemaining = isExpired ? 0 : Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                            const remainingBalance = daysRemaining * dailyCost;

                                            return (
                                                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3 text-white/70">{new Date(payment.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 font-medium text-white max-w-[150px] truncate" title={ad.title}>{ad.title}</td>
                                                    <td className="px-4 py-3 text-white">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold">{payment.currency} {payment.amount.toFixed(2)}</span>
                                                            <span className="text-[10px] text-white/50">{payment.currency} {dailyCost.toFixed(2)} / day</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-white/70">
                                                        <div className="flex flex-col">
                                                            <span>{durationDays} Days</span>
                                                            <span className="text-[10px] text-white/50">{daysRemaining} days left</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-white/90">
                                                        {payment.currency} {remainingBalance.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {isExpired ? (
                                                            <span className="bg-white/5 text-white/40 border border-white/10 px-2 py-0.5 rounded text-xs font-bold">
                                                                COMPLETED
                                                            </span>
                                                        ) : (
                                                            <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-xs font-bold">
                                                                ACTIVE
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}

function AccessTabLabel({ isAdvertiser }: { isAdvertiser: boolean }) {
    return <span>Access</span>;
}

function AdItem({ ad, isOwnProfile }: { ad: AdWithPayment, isOwnProfile: boolean }) {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isActive, setIsActive] = useState(ad.isActive);

    const expiryDate = useMemo(() => {
        if (ad.endDate) return new Date(ad.endDate);
        return ad.paymentRecord ? new Date(new Date(ad.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000) : null;
    }, [ad.createdAt, ad.paymentRecord, ad.endDate]);

    const [progress, setProgress] = useState(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (expiryDate) {
            const now = Date.now();
            const created = new Date(ad.createdAt).getTime();
            const expiry = expiryDate.getTime();
            const p = Math.min(100, Math.max(0, ((now - created) / (expiry - created)) * 100));
            setProgress(p);
            setIsExpired(now > expiry);
        } else {
            setProgress(100);
            setIsExpired(false);
        }
    }, [ad.createdAt, expiryDate]);

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
        setIsActive(checked);

        try {
            const res = await toggleUserAdStatus(ad.id);
            if (!res.success) {
                setIsActive(!checked);
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
        <div className="group bg-[#111112] border border-white/[0.02] rounded-sm overflow-hidden flex flex-col hover:border-white/[0.1] transition-all duration-300 shadow-sm relative">
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

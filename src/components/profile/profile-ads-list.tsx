'use client';

import { useState } from 'react';
import { SponsoredPost, AdPayment } from '@prisma/client';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Eye, MousePointer2, Plus, Calendar } from 'lucide-react';
import { AdSubmissionDialog } from '@/components/ads/ad-submission-dialog';
import { toggleUserAdStatus } from '@/lib/actions/ads';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type AdWithPayment = SponsoredPost & { payment: AdPayment | null };

export default function ProfileAdsList({ ads, isOwnProfile }: { ads: AdWithPayment[], isOwnProfile: boolean }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white">Ad Management</h2>
                {isOwnProfile && (
                    <Button onClick={() => setIsDialogOpen(true)} className="gap-2 bg-white/10 text-white hover:bg-white/20 border-white/5 shadow-xl backdrop-blur-md rounded-xl transition-all hover:scale-105 active:scale-95">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Create Ad</span>
                    </Button>
                )}
            </div>

            <AdSubmissionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />

            {!ads || ads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 text-center">
                    <div className="text-xl font-bold mb-2">No Ads Found</div>
                    <p className="text-muted-foreground max-w-sm mb-4">
                        {isOwnProfile ? "You haven't submitted any advertisements yet." : "This user hasn't posted any ads."}
                    </p>
                    {isOwnProfile && <Button onClick={() => setIsDialogOpen(true)} variant="secondary">Create Your First Ad</Button>}
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {ads.map(ad => <AdItem key={ad.id} ad={ad} isOwnProfile={isOwnProfile} />)}
                </div>
            )}
        </div>
    );
}

function AdItem({ ad, isOwnProfile }: { ad: AdWithPayment, isOwnProfile: boolean }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [isActive, setIsActive] = useState(ad.isActive);

    const expiryDate = ad.payment ? new Date(new Date(ad.createdAt).getTime() + ad.payment.durationDays * 24 * 60 * 60 * 1000) : null;
    const isExpired = expiryDate ? new Date() > expiryDate : false;

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
                toast({ title: checked ? "Ad Enabled" : "Ad Disabled", description: "Status updated." });
            }
        } catch (e) {
            setIsActive(!checked);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-white/20 transition-all duration-300 shadow-xl">
            <div className="relative h-48 w-full bg-black/50 overflow-hidden">
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
                        <span className="font-bold text-white uppercase tracking-widest border border-white/50 px-2 py-1 text-xs rounded bg-black/40 backdrop-blur-sm">Disabled</span>
                    </div>
                )}
                {isExpired && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-[2px] z-20">
                        <span className="font-bold text-red-500 uppercase tracking-widest border border-red-500/50 p-2 rounded bg-black/60">Expired</span>
                    </div>
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-lg text-white line-clamp-1 flex-1">{ad.title}</h3>
                </div>

                <p className="text-sm text-white/60 line-clamp-2 mb-4 h-10">{ad.description || 'No description provided.'}</p>

                {expiryDate && (
                    <div className="flex items-center gap-2 text-xs text-white/40 mb-4">
                        <Calendar className="w-3 h-3" />
                        <span>Expires: {expiryDate.toLocaleDateString()}</span>
                    </div>
                )}

                <div className="mt-auto space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-center border border-white/5 transition-colors group-hover:bg-white/10">
                            <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                                <Eye className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Views</span>
                            </div>
                            <span className="text-lg font-bold text-white">{ad.views}</span>
                        </div>

                        <div className="bg-white/5 rounded-xl p-2 flex flex-col items-center justify-center border border-white/5 transition-colors group-hover:bg-white/10">
                            <div className="flex items-center gap-1.5 text-green-400 mb-1">
                                <MousePointer2 className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Clicks</span>
                            </div>
                            <span className="text-lg font-bold text-white">{ad.clicks}</span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                        <span className="text-xs font-medium text-white/70">
                            {ad.status === 'APPROVED' ? (isExpired ? "Expired" : isActive ? "Active" : "Paused") : "Reviewing"}
                        </span>
                        <Switch
                            checked={isActive}
                            onCheckedChange={handleToggle}
                            disabled={!isOwnProfile || ad.status !== 'APPROVED' || loading || isExpired}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'APPROVED') return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 px-2.5 py-0.5">Approved</Badge>;
    if (status === 'REJECTED') return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-2.5 py-0.5">Rejected</Badge>;
    return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 px-2.5 py-0.5">Pending</Badge>;
}

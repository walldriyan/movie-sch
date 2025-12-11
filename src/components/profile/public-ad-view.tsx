'use client';

import { SponsoredPost } from '@prisma/client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, Eye, MousePointer2, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { clickAd } from '@/lib/actions/ads';
import { useToast } from '@/hooks/use-toast';

export default function PublicAdView({ ad, canViewStats = false }: { ad: SponsoredPost, canViewStats?: boolean }) {
    const { toast } = useToast();

    const handleVisit = () => {
        clickAd(ad.id);
        window.open(ad.link, '_blank');
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast({ title: "Copied Link", description: "Ad link copied to clipboard." });
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {/* Hero Image */}
                <div className="relative w-full aspect-video md:aspect-[21/9] bg-black/50 border-b border-white/10">
                    <Image
                        src={ad.imageUrl}
                        alt={ad.title}
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30 px-3 py-1">
                                    Sponsored Content
                                </Badge>
                                {ad.status !== 'APPROVED' && (
                                    <Badge variant="destructive">Pending / Inactive</Badge>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">{ad.title}</h1>
                            <div className="flex items-center gap-4 text-sm text-white/50">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    <span>Posted {new Date(ad.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="icon" onClick={handleShare} className="rounded-full border-white/10 hover:bg-white/10">
                                <Share2 className="w-4 h-4" />
                            </Button>
                            <Button onClick={handleVisit} size="lg" className="rounded-full bg-white text-black hover:bg-white/90 font-bold px-8 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                Visit Website <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none mb-10 bg-white/5 p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                            About this Ad
                        </h3>
                        <p className="text-white/70 leading-relaxed text-lg whitespace-pre-line">{ad.description || "No description available."}</p>
                    </div>

                    {/* Public Stats - Only visible to Owner or Super Admin */}
                    {canViewStats && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4 border border-white/5">
                                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-full">
                                    <Eye className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Total Views</p>
                                    <p className="text-2xl font-bold text-white">{ad.views.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 flex items-center gap-4 border border-white/5">
                                <div className="p-3 bg-green-500/20 text-green-400 rounded-full">
                                    <MousePointer2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Interactions</p>
                                    <p className="text-2xl font-bold text-white">{ad.clicks.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

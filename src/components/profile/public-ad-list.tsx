'use client';

import { SponsoredPost } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { clickAd } from '@/lib/actions/ads';

export default function PublicAdList({ ads, highlightId }: { ads: SponsoredPost[], highlightId?: string }) {
    if (!ads || ads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <ExternalLink className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Active Ads</h3>
                <p className="text-white/50">This user has no active sponsored content at the moment.</p>
            </div>
        );
    }

    const handleVisit = (adId: string) => {
        clickAd(adId);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {ads.map((ad, index) => {
                const isHighlight = ad.id === highlightId;
                return (
                    <div
                        key={ad.id}
                        className={`group bg-[#1a1a1a] border rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${isHighlight ? 'border-purple-500/50 shadow-purple-500/10 ring-1 ring-purple-500/30' : 'border-white/10 hover:border-white/20'}`}
                    >
                        {/* Image Area */}
                        <div className="relative aspect-video w-full bg-black/50 overflow-hidden">
                            <Image
                                src={ad.imageUrl}
                                alt={ad.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute top-3 right-3 z-10">
                                <Badge className="bg-black/60 backdrop-blur-md border border-white/10 hover:bg-black/70">
                                    Sponsored
                                </Badge>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-1">
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-purple-400 transition-colors">
                                    {ad.title}
                                </h3>
                                <p className="text-white/60 text-sm line-clamp-3 h-[60px]">
                                    {ad.description || "No description provided."}
                                </p>
                            </div>

                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="text-xs text-white/40 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(ad.createdAt).toLocaleDateString()}
                                </span>
                                <Button
                                    size="sm"
                                    className="rounded-full bg-white text-black hover:bg-white/90 font-bold"
                                    onClick={() => handleVisit(ad.id)}
                                    asChild
                                >
                                    <Link href={ad.link} target="_blank">
                                        Visit Site <ExternalLink className="w-3 h-3 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

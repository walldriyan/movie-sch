'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getAdsConfig, type AdUnit } from '@/lib/actions/ads'; // Keep types from server action, but helper function might be needed if direct import fails on client without proper bundle, but standard Next.js SC imports work.
// Actually, calling getAdsConfig from client component requires it to be a Server Action.

interface AdDisplayProps {
    slotId: string;
    className?: string;
}

export default function AdDisplay({ slotId, className = '' }: AdDisplayProps) {
    const [ad, setAd] = useState<AdUnit | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        async function fetchAd() {
            try {
                // In a real app, you might want to pass the initial config via props (SSR) 
                // to avoid layout shift, but for this "manager" dynamic requirement, fetching is okay.
                // Or better, use a global context. For now, fetching per unit.
                const config = await getAdsConfig();
                const found = config.find(u => u.id === slotId);
                if (found && found.active && found.imageUrl) {
                    setAd(found);
                    setIsVisible(true);
                }
            } catch (error) {
                console.error("Ads fetch error:", error);
            }
        }
        fetchAd();
    }, [slotId]);

    if (!isVisible || !ad) return null;

    return (
        <div className={`flex justify-center my-6 ${className}`}>
            <a
                href={ad.linkUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow"
                style={{ width: ad.width, maxWidth: '100%' }}
            >
                {/* We use standard img for external URLs to avoid domain config issues with Next/Image for arbitrary ad networks, 
                    unless user whitelists them all. Since user wants "manual link", standard img is safer. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={ad.imageUrl}
                    alt={ad.name}
                    width={ad.width}
                    height={ad.height}
                    className="w-full h-auto object-cover"
                    style={{ aspectRatio: `${ad.width}/${ad.height}` }}
                />
                <div className="absolute top-0 right-0 bg-black/20 text-[8px] text-white px-1 uppercase tracking-wider backdrop-blur-sm">
                    Ad
                </div>
            </a>
        </div>
    );
}

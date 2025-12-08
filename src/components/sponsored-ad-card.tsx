
'use client';

import AdDisplay from "@/components/ads/ad-display";

interface SponsoredAdCardProps {
  slotId?: string;
  className?: string; // Allow passing className for margins
}

export default function SponsoredAdCard({ slotId = 'post_sidebar', className }: SponsoredAdCardProps) {
  // We delegate everything to AdDisplay which handles fetching and visibility.
  return <AdDisplay slotId={slotId} className={className} />;
}

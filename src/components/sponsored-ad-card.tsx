
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import Link from "next/link";

interface SponsoredAdCardProps {
  title?: string;
  description?: string;
  link?: string;
  imageUrl?: string;
}

export default function SponsoredAdCard({ title, description, link, imageUrl }: SponsoredAdCardProps) {
  return (
    <Card className="mt-6 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
          <DollarSign className="h-4 w-4" />
          Sponsored
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg">
            <p className="font-semibold">Ads will be placed here</p>
            <p className="text-xs mt-1">This is a placeholder for future advertisements.</p>
        </div>
      </CardContent>
    </Card>
  );
}

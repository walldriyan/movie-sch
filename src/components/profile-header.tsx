'use client';

import { MoreHorizontal, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

export default function ProfileHeader({ username }: { username: string }) {
  return (
    <div className="sticky top-16 bg-background/95 backdrop-blur-sm z-30 -mx-4 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between h-16">
          <div>
            <h2 className="text-2xl font-bold">{username}</h2>
            <p className="text-sm text-muted-foreground">1.2K Followers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">Follow</Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal />
            </Button>
          </div>
        </div>
        <Separator />
      </div>
    </div>
  );
}

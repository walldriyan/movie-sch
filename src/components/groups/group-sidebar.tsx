
'use client';

import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Calendar } from 'lucide-react';
import type { Group, User as PrismaUser, GroupMember } from '@prisma/client';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

type GroupWithDetails = Group & {
    author: PrismaUser;
    members: (GroupMember & {
        user: PrismaUser;
    })[];
};

interface GroupSidebarProps {
  group: GroupWithDetails;
}

export default function GroupSidebar({ group }: GroupSidebarProps) {
    const admin = group.members.find(m => m.role === 'ADMIN')?.user || group.author;
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        // This effect runs only on the client after hydration
        const date = new Date(group.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
        setFormattedDate(date);
    }, [group.createdAt]);


    return (
        <div className="space-y-6 overflow-hidden">
           <div className="flex justify-between items-start">
             <div>
                <h2 className="text-xl font-bold">{group.name}</h2>
             </div>
           </div>
          
           <div className='space-y-4'>
                <div className="flex items-center gap-4 text-muted-foreground">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">
                        {formattedDate ? (
                            `Created on ${formattedDate}`
                        ) : (
                            <Skeleton className="h-4 w-32" />
                        )}
                    </span>
                </div>

                 <div className="flex items-center gap-4 text-muted-foreground">
                    <User className="w-5 h-5" />
                    <span className="text-sm">Managed by 
                        <Link href={`/profile/${admin.id}`} className='text-primary hover:underline ml-1'>
                            {admin.name}
                        </Link>
                    </span>
                </div>
           </div>

        </div>
    );
}

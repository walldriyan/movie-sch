
'use client';

import { MoreHorizontal, Camera, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import type { Group, User, GroupMember } from '@prisma/client';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateGroupMembers } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type GroupWithDetails = Group & {
    author: User;
    members: (GroupMember & {
        user: User;
    })[];
};

interface GroupHeaderProps {
    group: GroupWithDetails;
    currentUser?: User;
    isMember: boolean;
    isOwner: boolean;
}

export default function GroupHeader({ group, currentUser, isMember, isOwner }: GroupHeaderProps) {
    const { toast } = useToast();
    const router = useRouter();

    const coverImage = `https://picsum.photos/seed/${group.id + 10}/1200/400`;
    const groupAvatar = `https://picsum.photos/seed/${group.id}/400/400`;
    
    const handleMembership = async () => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'You must be logged in.' });
            return;
        }

        const currentMemberIds = group.members.map(m => m.userId);
        let newMemberIds: string[];

        if (isMember) {
            newMemberIds = currentMemberIds.filter(id => id !== currentUser.id);
        } else {
            newMemberIds = [...currentMemberIds, currentUser.id];
        }

        try {
            await updateGroupMembers(group.id, newMemberIds);
            toast({ title: 'Success', description: `You have ${isMember ? 'left' : 'joined'} the group.` });
            router.refresh();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };

    return (
        <div className="border-b bg-background overflow-hidden ">
            <div className="relative h-48 group">
                <Image
                    src={coverImage}
                    alt="Cover image"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                {isOwner && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" className="bg-background/80">
                        <Camera className="mr-2 h-4 w-4" />
                        Change Cover
                    </Button>
                </div>
                )}
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16 sm:-mt-20 flex items-end justify-between">
                    <div className="flex items-end gap-4">
                        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background">
                            <AvatarImage src={groupAvatar} alt={group.name} />
                            <AvatarFallback>
                                {group.name?.charAt(0).toUpperCase() || 'G'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="pb-4">
                        <h2 className="text-2xl font-bold">{group.name}</h2>
                        <p className="text-sm text-muted-foreground">{group.members.length} Members</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pb-4 overflow-hidden ">
                        {currentUser && (
                             <Button variant="outline" onClick={handleMembership}>
                                {isMember ? <LogOut className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                {isMember ? 'Leave Group' : 'Join Group'}
                            </Button>
                        )}
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}


'use client';

import type { Group, User, GroupMember } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import GroupHeader from '@/components/groups/group-header';
import GroupSidebar from '@/components/groups/group-sidebar';
import { notFound, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { respondToGroupRequest } from '@/lib/actions/groupActions';
import { Check, X, ShieldQuestion, Loader2 } from 'lucide-react';
import { useTransition } from 'react';

type GroupWithDetails = Group & {
    author: User;
    members: (GroupMember & {
        user: User;
    })[];
};

interface GroupPageClientProps {
    group: GroupWithDetails;
    currentUser?: User & { role: string };
}

export default function GroupPageClient({ group, currentUser }: GroupPageClientProps) {
    if(!group) notFound();

    const router = useRouter();
    const { toast } = useToast();
    const [isResponding, startRespondingTransition] = useTransition();
    
    const isOwner = currentUser ? group.authorId === currentUser.id : false;
    const pendingRequests = group.members.filter(m => m.role === 'PENDING');
    const members = group.members.filter(m => m.role === 'MEMBER' || m.role === 'ADMIN');

    const handleRequestResponse = (membershipId: number, approve: boolean) => {
        startRespondingTransition(async () => {
            try {
                await respondToGroupRequest(membershipId, approve);
                toast({
                    title: `Request ${approve ? 'Approved' : 'Declined'}`,
                });
                router.refresh();
            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error', description: error.message });
            }
        });
    }
    
    return (
        <>
            <GroupHeader group={group} currentUser={currentUser} />
            <main className='overflow-hidden'>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
                    <Tabs defaultValue="about" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8">
                            <TabsTrigger value="about">About</TabsTrigger>
                            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                             {isOwner && (
                                <TabsTrigger value="requests" className="relative">
                                    Requests 
                                    {pendingRequests.length > 0 && <span className="absolute top-0 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">{pendingRequests.length}</span>}
                                </TabsTrigger>
                            )}
                        </TabsList>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            <div className="md:col-span-2 lg:col-span-3">
                                <TabsContent value="about">
                                    <div className="prose prose-invert max-w-none text-foreground/80" dangerouslySetInnerHTML={{ __html: group.description || 'No description available.' }}></div>
                                </TabsContent>
                                <TabsContent value="members">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {members.map(member => (
                                            <Link href={`/profile/${member.user.id}`} key={member.userId} className="flex flex-col items-center group">
                                                <Avatar className="w-24 h-24 text-4xl border-2 border-transparent group-hover:border-primary transition-colors">
                                                    <AvatarImage src={member.user.image || ''} alt={member.user.name || ''} />
                                                    <AvatarFallback>{member.user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div className='text-center mt-2'>
                                                    <h3 className="font-semibold group-hover:text-primary">{member.user.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{member.role}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </TabsContent>
                                {isOwner && (
                                    <TabsContent value="requests">
                                        <div className="space-y-4">
                                            {pendingRequests.length > 0 ? (
                                                pendingRequests.map(request => (
                                                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar>
                                                                <AvatarImage src={request.user.image || ''} alt={request.user.name || ''} />
                                                                <AvatarFallback>{request.user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-semibold">{request.user.name}</p>
                                                                <p className="text-sm text-muted-foreground">{request.user.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button size="icon" variant="outline" className="text-green-500" onClick={() => handleRequestResponse(request.id, true)} disabled={isResponding}>
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="outline" className="text-destructive" onClick={() => handleRequestResponse(request.id, false)} disabled={isResponding}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center text-muted-foreground p-8 border-dashed border rounded-lg">
                                                    <ShieldQuestion className="h-12 w-12 mx-auto mb-4" />
                                                    <p>No pending join requests.</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                )}
                                <TabsContent value="posts">
                                    <p className="text-muted-foreground">Posts from this group will appear here.</p>
                                </TabsContent>
                            </div>
                            <aside>
                                <div className="sticky top-24">
                                    <GroupSidebar group={group} />
                                </div>
                            </aside>
                        </div>
                    </Tabs>
                </div>
            </main>
        </>
    );
}

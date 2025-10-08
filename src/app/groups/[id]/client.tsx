
'use client';

import type { Group, User, GroupMember } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import GroupHeader from '@/components/groups/group-header';
import GroupSidebar from '@/components/groups/group-sidebar';
import { notFound } from 'next/navigation';

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
    
    const isMember = currentUser ? group.members.some(m => m.userId === currentUser.id) : false;
    const isOwner = currentUser ? group.authorId === currentUser.id : false;
    
    return (
        <>
            <GroupHeader group={group} currentUser={currentUser} isMember={isMember} isOwner={isOwner}/>
            <main className='overflow-hidden'>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
                    <Tabs defaultValue="about" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8">
                            <TabsTrigger value="about">About</TabsTrigger>
                            <TabsTrigger value="members">Members ({group.members.length})</TabsTrigger>
                            <TabsTrigger value="posts">Posts</TabsTrigger>
                        </TabsList>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            <div className="md:col-span-2 lg:col-span-3">
                                <TabsContent value="about">
                                    <div className="prose prose-invert max-w-none text-foreground/80" dangerouslySetInnerHTML={{ __html: group.description || 'No description available.' }}></div>
                                </TabsContent>
                                <TabsContent value="members">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {group.members.map(member => (
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


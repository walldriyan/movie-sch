
'use client';

import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { GroupForProfile, Post } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Users, Rss, Lock, UserPlus, LogOut, Loader2 } from 'lucide-react';
import PostGrid from '@/components/post-grid';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { requestToJoinGroup, leaveGroup } from '@/lib/actions';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function GroupProfileClient({ group }: { group: GroupForProfile }) {
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const [isPending, startTransition] = useTransition();

  // Optimistic state
  const [optimisticState, setOptimisticState] = useState({
      isMember: group.isMember,
      membershipStatus: group.membershipStatus,
      memberCount: group._count.members,
  });

  const coverImage = group.coverPhoto || PlaceHolderImages.find(
    (img) => img.id === 'movie-poster-placeholder'
  )?.imageUrl;

  const groupAvatar = group.profilePhoto || PlaceHolderImages.find(
    (img) => img.id === 'avatar-3'
  )?.imageUrl;
  
  const posts = group.posts as any[];

  const handleJoin = () => {
      if (!currentUser) {
          toast({ variant: 'destructive', title: 'Please log in to join.'});
          return;
      }
      startTransition(async () => {
          setOptimisticState(prev => ({...prev, membershipStatus: 'PENDING'}));
          try {
              const result = await requestToJoinGroup(group.id);
              if (result.status === 'ACTIVE') {
                setOptimisticState({ isMember: true, membershipStatus: 'ACTIVE', memberCount: optimisticState.memberCount + 1});
                toast({ title: "Welcome!", description: `You've joined the group "${group.name}".`});
              } else {
                 toast({ title: "Request Sent", description: `Your request to join "${group.name}" is pending approval.`});
              }
          } catch (error: any) {
              setOptimisticState({ isMember: group.isMember, membershipStatus: group.membershipStatus, memberCount: group._count.members }); // revert
              toast({ variant: 'destructive', title: 'Error', description: error.message });
          }
      });
  };

  const handleLeave = () => {
      if (!currentUser) return;
      startTransition(async () => {
          const wasMember = optimisticState.isMember;
          setOptimisticState({ isMember: false, membershipStatus: null, memberCount: optimisticState.memberCount - (wasMember ? 1 : 0) });
          try {
              await leaveGroup(group.id);
              toast({ title: "You've left the group.", description: `You are no longer a member of "${group.name}".`});
          } catch (error: any) {
              setOptimisticState({ isMember: group.isMember, membershipStatus: group.membershipStatus, memberCount: group._count.members }); // revert
              toast({ variant: 'destructive', title: 'Error', description: error.message });
          }
      });
  };

  const renderJoinButton = () => {
      if (!currentUser) {
          return <Button onClick={handleJoin}> <UserPlus className="mr-2 h-4 w-4" /> Join Group</Button>
      }
      if (optimisticState.isMember) {
           return <Button variant="outline" onClick={handleLeave} disabled={isPending}>
             {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
             Leave Group
           </Button>
      }
      if (optimisticState.membershipStatus === 'PENDING') {
          return <Button variant="secondary" disabled>Request Pending</Button>
      }
      return <Button onClick={handleJoin} disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
        Join Group
      </Button>
  }


  return (
    <div className="w-full bg-background text-foreground">
        <div className="border-b bg-background overflow-hidden ">
            <div className="relative h-48 md:h-64 group">
                {coverImage && (
                    <Image
                        src={coverImage}
                        alt="Cover image"
                        fill
                        className="object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16 sm:-mt-20 flex flex-col md:flex-row items-center md:items-end md:justify-between">
                    <div className="flex flex-col md:flex-row items-center text-center md:text-left md:items-end gap-4">
                        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background">
                            {groupAvatar && (
                                <AvatarImage src={groupAvatar} alt={group.name || 'Group'} />
                            )}
                            <AvatarFallback>
                                {group.name?.charAt(0).toUpperCase() || 'G'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="pb-4">
                            <h1 className="text-3xl font-bold">{group.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4"/> {optimisticState.memberCount} members
                                </span>
                                 <span className="flex items-center gap-1.5">
                                    <Rss className="w-4 h-4"/> {group.posts.length} posts
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pb-4 mt-4 md:mt-0">
                       {renderJoinButton()}
                    </div>
                </div>
            </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-3">
                    {group.visibility === 'PRIVATE' && (!currentUser || !group.isMember) ? (
                        <div className="flex flex-col items-center justify-center text-center p-16 border-2 border-dashed rounded-lg">
                            <Lock className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">This is a private group</h3>
                            <p className="text-muted-foreground mt-2">Join the group to see the posts shared here.</p>
                        </div>
                    ) : posts.length > 0 ? (
                        <PostGrid posts={posts} />
                    ) : (
                         <div className="flex flex-col items-center justify-center text-center p-16 border-2 border-dashed rounded-lg">
                            <h3 className="text-lg font-semibold">No Posts Yet</h3>
                            <p className="text-muted-foreground mt-2">There is no content in this group yet.</p>
                        </div>
                    )}
                </div>
                <aside className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">About this group</h3>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                     <div>
                        <h3 className="text-lg font-semibold mb-4">Members ({group.members.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            {group.members.map(member => (
                                <Link href={`/profile/${member.user.id}`} key={member.userId}>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.user.image || ''} alt={member.user.name || ''} />
                                        <AvatarFallback>{member.user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Link>
                            ))}
                        </div>
                    </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Created By</h3>
                        {group.createdBy && (
                             <Link href={`/profile/${group.createdBy.id}`} className="flex items-center gap-2 group/author">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={group.createdBy.image || ''} alt={group.createdBy.name || ''} />
                                    <AvatarFallback>{group.createdBy.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-foreground/80 group-hover/author:text-primary">
                                    {group.createdBy.name}
                                </span>
                            </Link>
                        )}
                    </div>
                </aside>
             </div>
        </main>
    </div>
  );
}

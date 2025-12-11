'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import GroupCard from '@/components/group-card';
import { Search, LayoutGrid, Users, Compass, LogOut, Settings, Plus, Loader2, UserPlus, ShieldAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostGrid from '@/components/post-grid';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { leaveGroup, requestToJoinGroup } from '@/lib/actions/groups';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface GroupListClientProps {
    groups: any[]; // Public groups for discovery
    userGroups?: { joined: any[], created: any[] };
    initialFeed?: { posts: any[], totalPages: number };
    currentUser?: any;
}

export default function GroupListClient({ groups, userGroups = { joined: [], created: [] }, initialFeed = { posts: [], totalPages: 0 }, currentUser }: GroupListClientProps) {
    const [search, setSearch] = useState('');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(search.toLowerCase()))
    );

    // Combine joined and created for "My Groups" list
    const myGroups = [...userGroups.joined];
    const joinedIds = new Set(myGroups.map(g => g.id));

    // Add created groups if not already in joined list
    userGroups.created.forEach(cg => {
        if (!joinedIds.has(cg.id)) {
            myGroups.push({ ...cg, role: 'ADMIN', joinedAt: cg.createdAt });
            joinedIds.add(cg.id);
        } else {
            // If already in list (e.g. joined), make sure we merge Pending Count if valid
            const index = myGroups.findIndex(g => g.id === cg.id);
            if (index !== -1 && cg._count?.pendingRequests) {
                myGroups[index] = { ...myGroups[index], _count: { ...myGroups[index]._count, pendingRequests: cg._count.pendingRequests } };
            }
        }
    });

    const handleLeave = (groupId: string, groupName: string) => {
        if (!confirm(`Are you sure you want to leave ${groupName}?`)) return;
        startTransition(async () => {
            try {
                await leaveGroup(groupId);
                toast.success(`You left ${groupName}`);
                router.refresh();
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleJoin = (groupId: string, groupName: string) => {
        if (!currentUser) return router.push('/auth');
        startTransition(async () => {
            try {
                const res = await requestToJoinGroup(groupId);
                toast.success(res.status === 'ACTIVE' ? `Joined ${groupName}!` : `Request sent to ${groupName}`);
                router.refresh();
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const hasGroups = myGroups.length > 0;
    const isMember = (groupId: string) => joinedIds.has(groupId);

    // Special Group Card with Join Button Overlay
    const NavigableGroupCard = ({ group }: { group: any }) => (
        <div className="relative group/card h-full">
            <GroupCard group={group} />
            {/* Join Button Independent of Hover */}
            {!isMember(group.id) && (
                <div className="absolute top-3 right-3 z-20">
                    <Button
                        size="sm"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleJoin(group.id, group.name);
                        }}
                        disabled={isPending}
                        className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-8 px-4"
                    >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
                        Join
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            {/* HERO SECTION */}
            <section className="relative pt-24 md:pt-32 pb-8 px-4 md:px-8">
                <div className="relative mx-auto max-w-7xl rounded-3xl overflow-hidden h-[300px] md:h-[350px] shadow-2xl border border-white/5 bg-[#0a0a0a]">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/60 to-blue-900/60 mix-blend-multiply z-10" />
                        <img
                            src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1769&auto=format&fit=crop"
                            alt="Groups Hero"
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-20" />
                    </div>

                    <div className="relative z-30 h-full flex flex-col justify-center px-6 md:px-12">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-semibold w-fit mb-4">
                            <Users className="w-3.5 h-3.5" />
                            <span>COMMUNITY</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
                            {hasGroups ? `Welcome back, ${currentUser?.name?.split(' ')[0] || 'Member'}` : 'Find Your Community'}
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 max-w-xl leading-relaxed drop-shadow-md">
                            {hasGroups
                                ? "Check out the latest discussions from your groups."
                                : "Join communities, share your interests, and start the conversation."}
                        </p>
                    </div>
                </div>
            </section>

            <div className="container max-w-7xl mx-auto px-4 pb-20">
                <Tabs defaultValue={hasGroups ? "feed" : "discover"} className="w-full">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-full backdrop-blur-md">
                            {currentUser && (
                                <>
                                    <TabsTrigger value="feed" className="rounded-full px-6 py-2">
                                        <LayoutGrid className="w-4 h-4 mr-2" />
                                        My Feed
                                    </TabsTrigger>
                                    <TabsTrigger value="my-groups" className="rounded-full px-6 py-2">
                                        <Users className="w-4 h-4 mr-2" />
                                        My Groups
                                    </TabsTrigger>
                                </>
                            )}
                            <TabsTrigger value="discover" className="rounded-full px-6 py-2">
                                <Compass className="w-4 h-4 mr-2" />
                                Discover
                            </TabsTrigger>
                        </TabsList>

                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search groups..."
                                className="bg-white/5 border-white/10 rounded-full pl-10 h-10 focus-visible:ring-primary/50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* MY FEED CONTENT */}
                    <TabsContent value="feed" className="mt-0">
                        {initialFeed.posts.length > 0 ? (
                            <PostGrid posts={initialFeed.posts} />
                        ) : (
                            <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <LayoutGrid className="w-8 h-8 opacity-50" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Your feed is empty</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mb-6">Join more groups to see posts here.</p>
                                <Button variant="secondary" onClick={() => document.getElementById('discover-trigger')?.click()}>
                                    Browse Groups
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* MY GROUPS CONTENT */}
                    <TabsContent value="my-groups" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myGroups.map((group) => (
                                <div key={group.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition-all hover:bg-white/10">
                                    <div className="relative h-48 w-full overflow-hidden">
                                        {group.coverPhoto ? (
                                            <img src={group.coverPhoto} alt={group.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="h-full w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3 z-20">
                                            <Avatar className="h-12 w-12 border-2 border-white/20 shadow-lg">
                                                <AvatarImage src={group.profilePhoto} />
                                                <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-white truncate leading-tight">{group.name}</h3>
                                                <p className="text-xs text-white/70 truncate flex items-center gap-1">
                                                    {group.role === 'ADMIN' || group.role === 'SUPER_ADMIN' ? 'Admin' : 'Member'}
                                                    <span>•</span>
                                                    {group._count?.members?.members ?? group._count?.members ?? 0} members
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 flex items-center gap-3">
                                        <Button asChild className="flex-1 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/5">
                                            <Link href={`/groups/${group.id}`}>View Group</Link>
                                        </Button>

                                        {/* Pending Requests Badge/Link */}
                                        {group._count?.pendingRequests > 0 && (
                                            <Button asChild size="icon" variant="ghost" className="relative rounded-full h-10 w-10 border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20" title={`${group._count.pendingRequests} Pending Requests`}>
                                                <Link href={`/groups/${group.id}?tab=requests`}>
                                                    <ShieldAlert className="w-4 h-4" />
                                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold animate-pulse">
                                                        {group._count.pendingRequests}
                                                    </span>
                                                </Link>
                                            </Button>
                                        )}

                                        {/* Admin Settings */}
                                        {(group.role === 'ADMIN' || group.role === 'SUPER_ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                                            <Button asChild size="icon" variant="ghost" className="rounded-full h-10 w-10 border border-white/10 hover:bg-white/10" title="Settings">
                                                <Link href={`/groups/${group.id}/settings`}><Settings className="w-4 h-4" /></Link>
                                            </Button>
                                        )}

                                        {/* Leave Action */}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="rounded-full h-10 w-10 border border-white/10 hover:bg-red-500/10 hover:text-red-400 text-muted-foreground"
                                            title="Leave Group"
                                            onClick={() => handleLeave(group.id, group.name)}
                                            disabled={isPending}
                                        >
                                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {/* Create New Group Card - Only for Super Admins */}
                            {currentUser?.role === 'SUPER_ADMIN' && (
                                <Link href="/admin?tab=groups" className="flex flex-col items-center justify-center h-[280px] rounded-3xl border border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                                    <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Plus className="w-8 h-8 text-white/50" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Create Group</h3>
                                    <p className="text-sm text-muted-foreground">Start a new community</p>
                                </Link>
                            )}
                        </div>
                    </TabsContent>

                    {/* DISCOVER CONTENT */}
                    <TabsContent value="discover" className="mt-0">
                        {filteredGroups.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredGroups.map((group) => (
                                    <NavigableGroupCard key={group.id} group={group} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                                <h3 className="text-xl font-bold mb-2">No groups found</h3>
                                <p className="text-muted-foreground">Try adjusting your search terms.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}



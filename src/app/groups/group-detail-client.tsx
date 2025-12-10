'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRef } from 'react';
import {
    Users, LayoutGrid, Settings, ShieldCheck, UserPlus, LogOut,
    Share2, Calendar, Lock, Globe, Check, Info, Film, Camera, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import PostGrid from '@/components/post-grid';
import { requestToJoinGroup, leaveGroup, manageGroupJoinRequest } from '@/lib/actions/groups';
import { uploadGroupCover } from '@/lib/actions/upload-group-cover';
import type { User } from '@prisma/client';
import { toast } from 'sonner';

interface GroupDetailClientProps {
    group: any;
    currentUser: User | null;
    initialRequests?: any[]; // For admin
}

export default function GroupDetailClient({ group, currentUser, initialRequests = [] }: GroupDetailClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [requests, setRequests] = useState(initialRequests);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Derived state
    const isAdmin = currentUser && (currentUser.role === 'SUPER_ADMIN' || group.createdById === currentUser.id);
    const isMember = group.isMember;
    const membershipStatus = group.membershipStatus;
    const isPrivate = group.visibility === 'PRIVATE';

    // Image Source Logic: Use DB value or fallback.
    // If DB value is null, we show a gradient.
    const hasCoverImage = !!group.coverPhoto;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setIsUploading(true);

        startTransition(async () => {
            try {
                const res = await uploadGroupCover(group.id, formData);
                if (res.success) {
                    toast.success("Cover updated successfully!");
                    router.refresh();
                } else {
                    toast.error("Failed to upload cover.");
                }
            } catch (error: any) {
                toast.error(error.message);
            } finally {
                setIsUploading(false);
            }
        });
    };

    const handleJoin = () => {
        if (!currentUser) return router.push('/login');
        startTransition(async () => {
            try {
                const res = await requestToJoinGroup(group.id);
                toast.success(res.status === 'ACTIVE' ? "You have joined the group!" : "Request sent successfully.");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleLeave = () => {
        if (!confirm("Are you sure you want to leave this group?")) return;
        startTransition(async () => {
            try {
                await leaveGroup(group.id);
                toast.success("You left the group.");
                router.refresh();
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    };

    const handleRequestAction = (userId: string, action: 'APPROVE' | 'REJECT') => {
        startTransition(async () => {
            try {
                await manageGroupJoinRequest(group.id, userId, action);
                setRequests((prev: any[]) => prev.filter(r => r.userId !== userId));
                toast.success(`Request ${action === 'APPROVE' ? 'approved' : 'rejected'}`);
                router.refresh();
            } catch (error: any) {
                toast.error(error.message);
            }
        });
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* HERO SECTION - Rounded Container Style with "Top Managed" */}
            <div className="pt-24 md:pt-32 px-4 md:px-8 max-w-[1600px] mx-auto mb-12">
                <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-[#0a0a0a] group/hero">

                    {/* Cover Image or Gradient */}
                    <div className="relative h-[350px] md:h-[450px] w-full">
                        {hasCoverImage ? (
                            <Image
                                src={group.coverPhoto}
                                alt={group.name}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 opacity-80" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>

                    {/* Admin Image Upload Button */}
                    {isAdmin && (
                        <div className="absolute top-4 right-4 z-30 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <Button
                                size="sm"
                                variant="secondary"
                                className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/10 gap-2"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                {isUploading ? 'Uploading...' : 'Change Cover'}
                            </Button>
                        </div>
                    )}

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 z-20">
                        <div className="flex flex-col md:flex-row items-end gap-6 md:gap-8">
                            {/* Profile Image - Elevated */}
                            <div className="relative shrink-0">
                                <div className="w-24 h-24 md:w-36 md:h-36 rounded-2xl border-4 border-white/5 overflow-hidden bg-muted shadow-2xl relative z-10">
                                    <Image
                                        src={group.profilePhoto || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=500&auto=format&fit=crop"}
                                        alt={group.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                {isAdmin && (
                                    <Link href={`/groups/${group.id}/settings`} className="absolute -top-2 -right-2 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-lg hover:scale-110">
                                        <Settings className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>

                            {/* Title and Info */}
                            <div className="flex-1 space-y-3 w-full mb-2">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        {group.visibility === 'PRIVATE' ? (
                                            <Badge variant="secondary" className="px-3 py-1 rounded-full gap-1.5 bg-white/10 text-white border-white/10 backdrop-blur-md font-medium"><Lock className="w-3.5 h-3.5" /> Private Group</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="px-3 py-1 rounded-full gap-1.5 bg-green-500/20 text-green-400 border-green-500/20 font-medium"><Globe className="w-3.5 h-3.5" /> Public Group</Badge>
                                        )}
                                        <Badge variant="outline" className="px-3 py-1 rounded-full border-white/20 text-white/80 bg-black/20 backdrop-blur-md">
                                            Est. {format(new Date(group.createdAt), 'yyyy')}
                                        </Badge>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">{group.name}</h1>
                                </div>

                                <p className="text-white/80 max-w-2xl text-base md:text-lg leading-relaxed line-clamp-2 drop-shadow-md">
                                    {group.description || "No description provided."}
                                </p>

                                <div className="flex items-center gap-6 text-sm text-white/70 font-medium pt-1">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" />
                                        <span><span className="text-white font-bold">{group._count.members}</span> Members</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Film className="w-4 h-4 text-blue-400" />
                                        <span><span className="text-white font-bold">{group.posts.length}</span> Posts</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 w-full md:w-auto pb-1">
                                {!isMember && !membershipStatus ? (
                                    <Button size="lg" className="flex-1 md:flex-none h-11 rounded-full text-base font-semibold bg-white text-black hover:bg-white/90 shadow-xl transition-transform hover:scale-105" onClick={handleJoin} disabled={isPending}>
                                        <UserPlus className="w-5 h-5 mr-2" />
                                        Join Group
                                    </Button>
                                ) : membershipStatus === 'PENDING' ? (
                                    <Button size="lg" variant="secondary" className="flex-1 md:flex-none h-11 rounded-full bg-white/20 text-white border border-white/10 backdrop-blur-md" disabled>
                                        Request Pending
                                    </Button>
                                ) : (
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <Button size="lg" variant="outline" className="flex-1 md:flex-none h-11 rounded-full border-white/20 bg-black/40 text-green-400 hover:bg-black/60 backdrop-blur-md" disabled>
                                            <Check className="w-5 h-5 mr-2" />
                                            Joined
                                        </Button>
                                        <Button size="icon" variant="destructive" className="h-11 w-11 rounded-full shrink-0 border border-white/10 shadow-lg" onClick={handleLeave} disabled={isPending} title="Leave Group">
                                            <LogOut className="w-5 h-5" />
                                        </Button>
                                    </div>
                                )}

                                <Button size="icon" variant="ghost" className="h-11 w-11 rounded-full border border-white/10 bg-black/20 text-white hover:bg-white/20 backdrop-blur-md" onClick={() => toast.info("Share feature coming soon!")}>
                                    <Share2 className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="container max-w-7xl mx-auto px-4 mt-8 md:mt-12">
                <Tabs defaultValue="feed" className="w-full">
                    {/* Floating Tab Bar - Centered and rounded */}
                    <div className="flex justify-center mb-10">
                        <TabsList className="bg-white/[0.05] border border-white/10 p-1 rounded-full backdrop-blur-md inline-flex h-auto">
                            <TabsTrigger value="feed" className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                                <LayoutGrid className="w-4 h-4 mr-2" />
                                Feed
                            </TabsTrigger>
                            <TabsTrigger value="members" className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                                <Users className="w-4 h-4 mr-2" />
                                Members
                            </TabsTrigger>
                            {isAdmin && requests.length > 0 && (
                                <TabsTrigger value="requests" className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    Requests <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.length}</span>
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="about" className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                                <Info className="w-4 h-4 mr-2" />
                                About
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Feed Content */}
                    <TabsContent value="feed" className="animate-in fade-in zoom-in-95 duration-300">
                        {(!isMember && isPrivate && !isAdmin) ? (
                            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <Lock className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Private Group</h3>
                                <p className="text-muted-foreground text-center max-w-md mb-8">You need to join this community to view its exclusive content.</p>
                                <Button size="lg" className="rounded-full font-semibold" onClick={handleJoin} disabled={membershipStatus === 'PENDING'}>
                                    {membershipStatus === 'PENDING' ? 'Request Pending' : 'Join to View'}
                                </Button>
                            </div>
                        ) : group.posts.length > 0 ? (
                            <PostGrid posts={group.posts} />
                        ) : (
                            <div className="text-center py-24 text-muted-foreground border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <LayoutGrid className="w-10 h-10 opacity-50" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">This group doesn't have any content yet. Be the first to start the conversation!</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Members Content */}
                    <TabsContent value="members" className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.members.map((member: any) => (
                                <div key={member.user.id} className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
                                    <Avatar className="w-14 h-14 border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                                        <AvatarImage src={member.user.image} className="object-cover" />
                                        <AvatarFallback>{member.user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold text-white text-lg flex items-center gap-2">
                                            {member.user.name}
                                            {member.role === 'ADMIN' && <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary hover:bg-primary/30 h-5 px-1.5">Admin</Badge>}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Joined {format(new Date(member.joinedAt), 'MMM yyyy')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Requests Content (Admin) */}
                    {isAdmin && (
                        <TabsContent value="requests" className="animate-in fade-in zoom-in-95 duration-300">
                            <div className="space-y-4 max-w-3xl mx-auto">
                                {requests.map((request: any) => (
                                    <div key={request.userId} className="flex items-center justify-between p-5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors shadow-sm">
                                        <div className="flex items-center gap-5">
                                            <Avatar className="w-14 h-14 border border-white/10">
                                                <AvatarImage src={request.user.image} />
                                                <AvatarFallback>{request.user.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-bold text-lg text-white">{request.user.name}</div>
                                                <div className="text-sm text-muted-foreground">Requested {format(new Date(request.joinedAt), 'MMM dd, yyyy')}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button size="sm" className="rounded-full px-5" onClick={() => handleRequestAction(request.userId, 'APPROVE')} disabled={isPending}>Approve</Button>
                                            <Button size="sm" variant="outline" className="rounded-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 px-5" onClick={() => handleRequestAction(request.userId, 'REJECT')} disabled={isPending}>Reject</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    )}

                    {/* About Content */}
                    <TabsContent value="about" className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="md:col-span-2 bg-white/[0.02] border-white/10 rounded-3xl overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-xl">About this Group</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
                                    <p>{group.description || "No description provided."}</p>

                                    <div className="pt-6 border-t border-white/5">
                                        <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Group Stats</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                                <div className="text-2xl font-bold text-white mb-1">{group._count.members}</div>
                                                <div className="text-xs text-muted-foreground">Total Members</div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                                <div className="text-2xl font-bold text-white mb-1">{group.posts.length}</div>
                                                <div className="text-xs text-muted-foreground">Shared Posts</div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                                <div className="text-2xl font-bold text-white mb-1">{format(new Date(group.createdAt), 'yyyy')}</div>
                                                <div className="text-xs text-muted-foreground">Founded Year</div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                                <div className="text-2xl font-bold text-white mb-1">{group.visibility === 'PUBLIC' ? 'Public' : 'Private'}</div>
                                                <div className="text-xs text-muted-foreground">Access Type</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-primary/20 to-purple-600/20 border border-white/10 rounded-3xl p-6 text-center">
                                    <Globe className="w-12 h-12 text-white/80 mx-auto mb-4" />
                                    <h3 className="font-bold text-white text-lg mb-2">Community Rules</h3>
                                    <p className="text-sm text-white/70 mb-6">Be respectful and kind to other members. No spam or inappropriate content.</p>
                                    <Button variant="outline" className="rounded-full w-full border-white/20 bg-white/10 hover:bg-white/20 text-white">Read Guidelines</Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

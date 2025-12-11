'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Activity,
    BookOpen,
    Heart,
    LayoutGrid,
    Bell,
    Plus,
    User,
    Settings,
    LogOut,
    CheckCircle2,
    Clock,
    Trophy,
    FileText,
    Star,
    Film
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ActivityHubProps {
    user: any;
    notifications: any[];
    posts: any[];
    favorites: any[];
    examResults: any[];
    stats: {
        totalPosts: number;
        totalFavorites: number;
        examsTaken: number;
        averageScore: number;
    };
}

export default function ActivityHubClient({
    user,
    notifications,
    posts,
    favorites,
    examResults,
    stats
}: ActivityHubProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const QuickStat = ({ icon: Icon, label, value, color }: any) => (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/[0.05] transition-all cursor-default group">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", color)}>
                <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</p>
                <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
            </div>
        </div>
    );

    const NotificationItem = ({ notif }: { notif: any }) => (
        <div className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium leading-snug text-white/90">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </p>
            </div>
            {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-2" />}
        </div>
    );

    const getPostLink = (post: any) => {
        if (post.seriesId) {
            return `/series/${post.seriesId}?post=${post.id}`;
        }
        return `/movies/${post.id}`;
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* HERO SECTION - Rounded Container Style with "Top Managed" */}
            <div className="pt-24 md:pt-32 px-4 md:px-8 max-w-[1600px] mx-auto mb-12">
                <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-[#0a0a0a] group/hero">

                    {/* Cover Gradient */}
                    <div className="relative h-[350px] md:h-[400px] w-full">
                        <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {/* Abstract animated shapes */}
                        <div className="absolute top-0 right-0 w-full h-full overflow-hidden opacity-30">
                            <div className="absolute top-10 right-10 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
                            <div className="absolute bottom-10 left-10 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-1000" />
                        </div>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 z-20">
                        <div className="flex flex-col md:flex-row items-end gap-6 md:gap-8">
                            {/* Profile Image - Elevated */}
                            <div className="relative shrink-0">
                                <div className="w-24 h-24 md:w-36 md:h-36 rounded-3xl border-4 border-white/5 overflow-hidden bg-muted shadow-2xl relative z-10">
                                    {user.image ? (
                                        <Image src={user.image} alt={user.name} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white">
                                            {user.name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-3 -right-3 z-20">
                                    <Link href={`/profile/${user.id}`}>
                                        <div className="bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-lg hover:scale-110 cursor-pointer">
                                            <Settings className="w-4 h-4" />
                                        </div>
                                    </Link>
                                </div>
                            </div>

                            {/* Title and Info */}
                            <div className="flex-1 space-y-3 w-full mb-2">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <Badge variant="secondary" className="px-3 py-1 rounded-full gap-1.5 bg-white/10 text-white border-white/10 backdrop-blur-md font-medium"><User className="w-3.5 h-3.5" /> Personal Hub</Badge>
                                        <Badge variant="outline" className="px-3 py-1 rounded-full border-white/20 text-white/80 bg-black/20 backdrop-blur-md">
                                            {user.role}
                                        </Badge>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
                                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">{user.name}</span>
                                    </h1>
                                </div>

                                <p className="text-white/70 max-w-2xl text-base md:text-lg leading-relaxed line-clamp-2 drop-shadow-md">
                                    Track your learning progress, manage your content, and stay updated with your latest notifications.
                                </p>

                                <div className="flex items-center gap-6 text-sm text-white/70 font-medium pt-1">
                                    <div className="flex items-center gap-2">
                                        <LayoutGrid className="w-4 h-4 text-blue-400" />
                                        <span><span className="text-white font-bold">{stats.totalPosts}</span> Posts</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Heart className="w-4 h-4 text-pink-400" />
                                        <span><span className="text-white font-bold">{stats.totalFavorites}</span> Favorites</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-orange-400" />
                                        <span><span className="text-white font-bold">{stats.examsTaken}</span> Exams</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 w-full md:w-auto pb-1">
                                <Button asChild size="lg" className="flex-1 md:flex-none h-11 rounded-full text-base font-semibold bg-white text-black hover:bg-white/90 shadow-xl transition-transform hover:scale-105">
                                    <Link href="/manage">
                                        <Plus className="w-5 h-5 mr-2" />
                                        Create Post
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    <QuickStat icon={LayoutGrid} label="Total Posts" value={stats.totalPosts} color="bg-blue-500" />
                    <QuickStat icon={Heart} label="Favorites" value={stats.totalFavorites} color="bg-pink-500" />
                    <QuickStat icon={BookOpen} label="Exams Taken" value={stats.examsTaken} color="bg-orange-500" />
                    <QuickStat icon={Trophy} label="Avg. Score" value={`${Math.round(stats.averageScore)}%`} color="bg-emerald-500" />
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-8" onValueChange={setActiveTab}>
                    {/* Floating Tab Bar - Centered and rounded */}
                    <div className="flex justify-center mb-10">
                        <TabsList className="bg-white/[0.05] border border-white/10 p-1 rounded-full backdrop-blur-md inline-flex h-auto">
                            <TabsTrigger value="overview" className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                                <Activity className="w-4 h-4 mr-2" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="posts" className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                                <FileText className="w-4 h-4 mr-2" />
                                My Posts
                            </TabsTrigger>
                            <TabsTrigger value="favorites" className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                                <Heart className="w-4 h-4 mr-2" />
                                Favorites
                            </TabsTrigger>
                            <TabsTrigger value="exams" className="rounded-full px-6 py-2.5 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Exams
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Col: Recent Activity & Notifications */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="bg-white/[0.02] border-white/10 backdrop-blur-sm overflow-hidden rounded-3xl">
                                    <CardHeader className="border-b border-white/5 py-4 px-6">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Bell className="w-5 h-5 text-primary" /> Notifications
                                            </CardTitle>
                                            <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">{notifications.filter(n => !n.read).length} New</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <ScrollArea className="h-[400px]">
                                            <div className="p-4 space-y-2">
                                                {notifications.length > 0 ? (
                                                    notifications.map(n => <NotificationItem key={n.id} notif={n} />)
                                                ) : (
                                                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                                        <Bell className="w-12 h-12 opacity-20 mb-4" />
                                                        <p>No new notifications</p>
                                                        <p className="text-xs mt-1">You're all caught up!</p>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Col: Recent Exams/Stats */}
                            <div className="space-y-6">
                                <Card className="bg-white/[0.02] border-white/10 backdrop-blur-sm rounded-3xl">
                                    <CardHeader className="py-4 border-b border-white/5 px-6">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">Recent Results</CardTitle>
                                            <Button variant="link" size="sm" asChild className="h-auto p-0 text-muted-foreground hover:text-primary">
                                                <Link href="/activity?tab=exams">View All</Link>
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        {examResults.slice(0, 3).map((res) => (
                                            <div key={res.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/5">
                                                <div>
                                                    <p className="font-medium text-sm text-white">{res.exam.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">{new Date(res.submittedAt).toLocaleDateString()}</p>
                                                </div>
                                                <Badge className={cn(
                                                    "font-bold rounded-lg",
                                                    res.score >= 75 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" :
                                                        res.score >= 50 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/20" : "bg-red-500/20 text-red-400 border-red-500/20"
                                                )}>
                                                    {res.score}%
                                                </Badge>
                                            </div>
                                        ))}
                                        {examResults.length === 0 && (
                                            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                                                <BookOpen className="w-10 h-10 opacity-20 mb-3" />
                                                <p className="text-sm">No exams taken yet.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* POSTS TAB */}
                    <TabsContent value="posts" className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map(post => (
                                <Link key={post.id} href={getPostLink(post)} className="group block h-full">
                                    <Card className="h-full bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-primary/20 transition-all overflow-hidden group-hover:-translate-y-1 rounded-2xl">
                                        <div className="relative aspect-video bg-black/50">
                                            {post.posterUrl ? (
                                                <Image src={post.posterUrl} alt={post.title} fill className="object-cover transition-transform group-hover:scale-105" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><LayoutGrid className="w-10 h-10 opacity-20" /></div>
                                            )}
                                            <div className="absolute top-2 right-2">
                                                <Badge className={cn("backdrop-blur-md", post.published ? "bg-emerald-500/80" : "bg-yellow-500/80")}>
                                                    {post.published ? 'Published' : 'Draft'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardContent className="p-5">
                                            <h3 className="font-bold truncate mb-1 text-lg group-hover:text-primary transition-colors text-white">{post.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{post.description || 'No description'}</p>
                                            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-white/5">
                                                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post._count?.favorites || 0}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                            {posts.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                                    <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                                    <h3 className="text-xl font-bold mb-2 text-white">No posts created yet</h3>
                                    <p className="text-muted-foreground mb-6">Share your first movie or series with the community.</p>
                                    <Button asChild className="rounded-full shadow-lg hover:scale-105 transition-transform">
                                        <Link href="/manage">Create Post</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* FAVORITES TAB */}
                    <TabsContent value="favorites" className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {favorites.map(fav => (
                                <Link key={fav.id} href={getPostLink(fav.post)} className="group block">
                                    <Card className="bg-white/[0.02] border-white/10 hover:bg-white/[0.04] transition-all overflow-hidden rounded-2xl group-hover:-translate-y-1">
                                        <div className="relative aspect-[2/3]">
                                            {fav.post.posterUrl ? (
                                                <Image src={fav.post.posterUrl} alt={fav.post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                            ) : (
                                                <div className="w-full h-full bg-black/50 flex items-center justify-center"><Film className="w-10 h-10 opacity-20" /></div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" className="rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/20 self-center mb-auto mt-auto scale-0 group-hover:scale-100 transition-transform delay-100">
                                                    <Activity className="w-5 h-5 text-white" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">{fav.post.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">{fav.post.type || 'Movie'}</p>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                            {favorites.length === 0 && (
                                <div className="col-span-full py-20 text-center text-muted-foreground bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                                    <Heart className="w-16 h-16 mx-auto opacity-20 mb-4" />
                                    <h3 className="text-xl font-bold mb-2 text-white">No favorites yet</h3>
                                    <p>Go explore movies and series to add them to your collection.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* EXAMS TAB */}
                    <TabsContent value="exams" className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {examResults.map((res) => (
                                <div key={res.id} className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-white/[0.02] border border-white/10 rounded-2xl hover:bg-white/[0.04] hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                                            <Trophy className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{res.exam.title}</h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                <Clock className="w-3.5 h-3.5" /> Completed {formatDistanceToNow(new Date(res.submittedAt), { addSuffix: true })}
                                                <span>•</span> Total Questions: {res.exam?._count?.questions || 0}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 pl-16 md:pl-0">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">{res.score}%</div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Score</div>
                                        </div>
                                        <Button asChild size="sm" variant="outline" className="rounded-full px-5 border-white/10 hover:bg-white/10">
                                            <Link href={`/activity/result/${res.id}`}>View Details</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {examResults.length === 0 && (
                                <div className="col-span-full py-20 text-center text-muted-foreground bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                                    <Trophy className="w-16 h-16 mx-auto opacity-20 mb-4" />
                                    <h3 className="text-xl font-bold mb-2 text-white">No exams taken</h3>
                                    <p>Complete exams to earn trophies and track your progress.</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}

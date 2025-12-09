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
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 flex items-center gap-4 hover:bg-card/80 transition-all cursor-default group">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", color)}>
                <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </div>
            <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{label}</p>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
            </div>
        </div>
    );

    const NotificationItem = ({ notif }: { notif: any }) => (
        <div className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium leading-snug">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </p>
            </div>
            {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-2" />}
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-black/40 border-b border-white/5 pt-28 pb-10 px-4 md:px-10">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 opacity-30" />
                <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-card shadow-2xl overflow-hidden">
                            {user.image ? (
                                <Image src={user.image} alt={user.name} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white">
                                    {user.name?.[0]}
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">{user.name}</span>
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Badge variant="outline" className="bg-white/5 border-white/10">{user.role}</Badge>
                                <span>•</span>
                                <span>{user.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button asChild className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 border-0 shadow-lg shadow-primary/20">
                            <Link href="/manage">
                                <Plus className="w-4 h-4" /> Create Post
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="gap-2 bg-card/50 backdrop-blur-sm">
                            <Link href={`/profile/${user.id}`}>
                                <User className="w-4 h-4" /> Profile
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-10 py-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <QuickStat icon={LayoutGrid} label="Total Posts" value={stats.totalPosts} color="bg-blue-500" />
                    <QuickStat icon={Heart} label="Favorites" value={stats.totalFavorites} color="bg-pink-500" />
                    <QuickStat icon={BookOpen} label="Exams Taken" value={stats.examsTaken} color="bg-orange-500" />
                    <QuickStat icon={Trophy} label="Avg. Score" value={`${Math.round(stats.averageScore)}%`} color="bg-emerald-500" />
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-8" onValueChange={setActiveTab}>
                    <div className="flex items-center justify-between">
                        <TabsList className="bg-card/50 border border-white/5 p-1 h-auto rounded-xl">
                            <TabsTrigger value="overview" className="rounded-lg gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                                <Activity className="w-4 h-4" /> Overview
                            </TabsTrigger>
                            <TabsTrigger value="exams" className="rounded-lg gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-500">
                                <BookOpen className="w-4 h-4" /> Exams
                            </TabsTrigger>
                            <TabsTrigger value="posts" className="rounded-lg gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-500">
                                <FileText className="w-4 h-4" /> My Posts
                            </TabsTrigger>
                            <TabsTrigger value="favorites" className="rounded-lg gap-2 data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-500">
                                <Heart className="w-4 h-4" /> Favorites
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Col: Recent Activity & Notifications */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card className="bg-card/40 border-white/5 backdrop-blur-sm overflow-hidden">
                                    <CardHeader className="border-b border-white/5 py-4">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <Bell className="w-5 h-5 text-primary" /> Notifications
                                            </CardTitle>
                                            <Badge variant="secondary">{notifications.filter(n => !n.read).length} New</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <ScrollArea className="h-[400px]">
                                            <div className="p-2 space-y-1">
                                                {notifications.length > 0 ? (
                                                    notifications.map(n => <NotificationItem key={n.id} notif={n} />)
                                                ) : (
                                                    <div className="p-8 text-center text-muted-foreground">No notifications</div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Col: Recent Exams/Stats */}
                            <div className="space-y-6">
                                <Card className="bg-card/40 border-white/5 backdrop-blur-sm">
                                    <CardHeader className="py-4 border-b border-white/5">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">Recent Results</CardTitle>
                                            <Button variant="link" size="sm" asChild className="h-auto p-0 text-muted-foreground">
                                                <Link href="/activity?tab=exams">View All</Link>
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        {examResults.slice(0, 3).map((res) => (
                                            <div key={res.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                                <div>
                                                    <p className="font-medium text-sm">{res.exam.title}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(res.submittedAt).toLocaleDateString()}</p>
                                                </div>
                                                <Badge className={cn(
                                                    "font-bold",
                                                    res.score >= 75 ? "bg-emerald-500/20 text-emerald-400" :
                                                        res.score >= 50 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                                                )}>
                                                    {res.score}%
                                                </Badge>
                                            </div>
                                        ))}
                                        {examResults.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">No exam results yet.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* POSTS TAB */}
                    <TabsContent value="posts">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {posts.map(post => (
                                <Link key={post.id} href={`/posts/${post.id}`} className="group block h-full">
                                    <Card className="h-full bg-card/40 border-white/5 hover:bg-card/60 hover:border-primary/20 transition-all overflow-hidden group-hover:-translate-y-1">
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
                                        <CardContent className="p-4">
                                            <h3 className="font-bold truncate mb-1 text-lg group-hover:text-primary transition-colors">{post.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{post.description || 'No description'}</p>
                                            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post._count?.favorites || 0}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                            {posts.length === 0 && (
                                <div className="col-span-full py-12 text-center bg-card/20 rounded-2xl border border-dashed border-white/10">
                                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                    <h3 className="text-lg font-medium">No posts created yet</h3>
                                    <Button asChild variant="link" className="mt-2 text-primary">
                                        <Link href="/manage">Create your first post</Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* FAVORITES TAB */}
                    <TabsContent value="favorites">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {favorites.map(fav => (
                                <Link key={fav.id} href={`/posts/${fav.post.id}`} className="group block">
                                    <Card className="bg-card/40 border-white/5 hover:bg-card/60 transition-all overflow-hidden">
                                        <div className="relative aspect-[2/3]">
                                            {fav.post.posterUrl ? (
                                                <Image src={fav.post.posterUrl} alt={fav.post.title} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-black/50 flex items-center justify-center"><Film className="w-10 h-10 opacity-20" /></div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 flex flex-col justify-end">
                                                <h3 className="font-bold text-white text-sm line-clamp-2">{fav.post.title}</h3>
                                                <p className="text-xs text-white/60 mt-1">{fav.post.type || 'Movie'}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                            {favorites.length === 0 && (
                                <div className="col-span-full py-12 text-center text-muted-foreground">
                                    <Heart className="w-12 h-12 mx-auto opacity-20 mb-3" />
                                    <p>No favorites yet. Go explore!</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* EXAMS TAB */}
                    <TabsContent value="exams">
                        <div className="space-y-4">
                            {examResults.map((res) => (
                                <div key={res.id} className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-card/40 border border-white/5 rounded-2xl hover:bg-card/60 hover:border-primary/20 transition-all">
                                    <div>
                                        <h3 className="font-bold text-lg">{res.exam.title}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                            <Clock className="w-3.5 h-3.5" /> Completed {formatDistanceToNow(new Date(res.submittedAt), { addSuffix: true })}
                                            <span>•</span> Total Questions: {res.exam?._count?.questions || 0}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">{res.score}%</div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Score</div>
                                        </div>
                                        <Button asChild size="sm" variant="outline" className="bg-white/5 hover:bg-white/10">
                                            <Link href={`/activity/result/${res.id}`}>View Details</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Film,
    Tv,
    FileText,
    ClipboardList,
    Sparkles,
    ArrowRight,
    Plus,
    Folder,
    BookOpen,
    Users,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CreateOption {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color: string;
    bgColor: string;
    image: string;
}

const createOptions: CreateOption[] = [
    {
        id: 'movie',
        title: 'Movie Post',
        description: 'Share a movie with details, poster, and ratings',
        icon: <Film className="w-5 h-5" />,
        href: '/manage?create=true',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
        image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop',
    },
    {
        id: 'series',
        title: 'TV Series',
        description: 'Create a series with multiple episodes',
        icon: <Tv className="w-5 h-5" />,
        href: '/series?create=true',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
        image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&h=400&fit=crop',
    },
    {
        id: 'exam',
        title: 'Exam / Quiz',
        description: 'Create an exam with questions and answers',
        icon: <ClipboardList className="w-5 h-5" />,
        href: '/admin/exams?create=true',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10 hover:bg-green-500/20',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop',
    },
    {
        id: 'group',
        title: 'Collection / Group',
        description: 'Organize content into themed collections',
        icon: <Folder className="w-5 h-5" />,
        href: '/admin/groups',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10 hover:bg-orange-500/20',
        image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=400&fit=crop',
    },
];

function CreateCard({ option }: { option: CreateOption }) {
    return (
        <Link href={option.href} className="block group">
            <div className="relative h-48 rounded-xl overflow-hidden">
                {/* Background Image */}
                <img
                    src={option.image}
                    alt={option.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />

                {/* Content */}
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    {/* Top - Button */}
                    <div className="flex justify-end">
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                            "bg-white text-black hover:bg-white/90"
                        )}>
                            {option.icon}
                            <span>Create</span>
                        </div>
                    </div>

                    {/* Bottom - Title & Description */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                            {option.title}
                        </h3>
                        <p className="text-sm text-white/70">
                            {option.description}
                        </p>
                    </div>
                </div>

                {/* Hover arrow */}
                <div className="absolute top-5 left-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-white" />
                </div>
            </div>
        </Link>
    );
}

export default function CreatePage() {
    return (
        <div className="min-h-screen bg-background overflow-hidden">
            {/* Hero Section */}
            <div className="relative pt-24 pb-16">
                {/* Background gradients - Suno.com style */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                    <div className="absolute top-20 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-white/80">Create Something New</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                        What would you like to
                        <br />
                        <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">create today</span>?
                    </h1>

                    {/* Description */}
                    <p className="text-lg text-white/50 max-w-xl mx-auto mb-12 leading-relaxed">
                        Start creating amazing content. Share movies, series, quizzes, or curated collections with your audience.
                    </p>
                </div>
            </div>

            {/* Create Options Grid */}
            <div className="max-w-4xl mx-auto px-4 pb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {createOptions.map((option) => (
                        <CreateCard key={option.id} option={option} />
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-16 text-center">
                    <p className="text-white/40 text-sm mb-6">Or explore other options</p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button variant="outline" size="sm" className="rounded-full border-white/10 hover:bg-white/5" asChild>
                            <Link href="/manage">
                                <Zap className="w-4 h-4 mr-2" />
                                Dashboard
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full border-white/10 hover:bg-white/5" asChild>
                            <Link href="/explore">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Explore Content
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full border-white/10 hover:bg-white/5" asChild>
                            <Link href="/">
                                <Users className="w-4 h-4 mr-2" />
                                Community
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

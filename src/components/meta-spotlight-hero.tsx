
"use client"

import React, { useState, useEffect, useRef } from 'react';
import type { Post } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ThumbsUp, Eye, Facebook, Instagram, Linkedin, Youtube, Link as LinkIcon, Twitter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';

export default function MetaSpotlightHero({ posts: initialPosts }: { posts: Post[] }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="bg-gradient-to-b from-background to-background/80 py-16 md:py-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="z-10 text-center lg:text-left">
                 <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]"
                    style={{ textShadow: '0 30px 350px rgba(0,0,0,0.9), 0 2px 350px rgba(0,0,0,0.7)' }}>
                    Unlock Your
                    <br />
                    Content Potential
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                    Get scalable, platform-specific content solutions tailored for you.
                </p>
                <div className="flex items-center justify-center lg:justify-start gap-4 my-8">
                    <Link href="#"><Facebook className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                    <Link href="#"><Instagram className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                    <Link href="#"><Linkedin className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                    <Link href="#"><Youtube className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                    <Link href="#"><Twitter className="h-6 w-6 text-muted-foreground hover:text-primary" /></Link>
                </div>
                <div className="flex flex-col items-center lg:items-start gap-4">
                    <Button size="lg" className="bg-primary/90 hover:bg-primary text-lg h-12 px-8">
                        <Avatar className="w-8 h-8 mr-3">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        Book a Call
                    </Button>
                    <p className="text-xs text-muted-foreground">Limited slots available.</p>
                </div>
            </div>

            <div 
              ref={containerRef}
              className="relative w-full flex items-center justify-center h-[200px] lg:h-[400px]"
            >
              {/* The user requested to remove the div with all the cards that was here. */}
            </div>
        </div>
    </div>
  );
}

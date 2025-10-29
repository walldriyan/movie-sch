
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

const getRandomValue = (min: number, max: number) => Math.random() * (max - min) + min;

export default function MetaSpotlightHero({ posts: initialPosts }: { posts: Post[] }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    // Sort posts by view count in descending order and take the top 10
    const sortedPosts = [...initialPosts]
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, 10);

    const generatedCards = sortedPosts.map((post, index) => {
      const isSeriesPost = post.series && post.series.posts && post.series.posts.length > 0;
      const isHeroIndex = sortedPosts.length > 2 ? Math.floor(sortedPosts.length / 2) : 0;
      const cardType = index === isHeroIndex ? 'hero' : (isSeriesPost ? 'series' : (index % 3 === 1 ? 'dots' : 'single'));

      return {
        id: `${post.id}-${index}`, // Create a unique key
        image: post.posterUrl || `https://picsum.photos/seed/${post.id}/600/800`,
        brand: post.author?.name || 'CineVerse',
        authorImage: post.author?.image,
        series: post.series,
        likeCount: post._count?.likedBy ?? 0,
        viewCount: post.viewCount ?? 0,
        type: cardType,
        rotation: index === isHeroIndex ? 0 : getRandomValue(-12, 12),
        distance: index === isHeroIndex ? 0.5 : getRandomValue(0.6, 0.8)
      };
    });
    setCards(generatedCards);
  }, [initialPosts]);


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        setMousePos({ x, y });
      }
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
      setIsHovering(false);
      setMousePos({ x: 0, y: 0 });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseenter', handleMouseEnter);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const handleWheelScroll = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        scrollEl.scrollLeft += e.deltaY;
      }
    };

    scrollEl.addEventListener('wheel', handleWheelScroll);
    return () => {
      scrollEl.removeEventListener('wheel', handleWheelScroll);
    };
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    const scrollEl = scrollContainerRef.current;
    if (scrollEl) {
      const scrollAmount = scrollEl.clientWidth * 0.8;
      scrollEl.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };


  const getCardTransform = (baseRotate: number, distanceMultiplier: number) => {
    if (!isHovering) {
      return `rotate(${baseRotate}deg)`;
    }
    const moveX = mousePos.x * 30 * distanceMultiplier;
    const moveY = mousePos.y * 30 * distanceMultiplier;
    const rotateAdjust = mousePos.x * 5;

    return `translate(${moveX}px, ${moveY}px) rotate(${baseRotate + rotateAdjust}deg) scale(1.15)`;
  };

  const renderSeriesGrid = (series: any) => {
    if (!series || !series.posts) return null;
    const otherPosts = series.posts;
    const totalCount = series._count?.posts || 0;

    return (
      <div className="grid grid-cols-3 gap-1.5 md:gap-2 p-2 md:p-3 bg-white">
        {Array.from({ length: 3 }).map((_, idx) => {
          const post = otherPosts[idx];
          if (idx < 2) {
            return (
              <div key={idx} className="aspect-square rounded bg-muted overflow-hidden relative">
                {post && post.posterUrl && (
                  <Image
                    src={post.posterUrl}
                    alt="series post"
                    fill
                    sizes="(max-width: 768px) 33vw, 20vw"
                    style={{ objectFit: 'cover' }}
                  />
                )}
              </div>
            );
          }
          if (idx === 2) {
            return (
              <div key={idx} className="aspect-square rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                +{totalCount}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const renderCard = (card: any) => {
    const isHero = card.type === 'hero';

    return (
      <div
        key={card.id}
        className={cn(
          "group flex-shrink-0 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-out flex flex-col h-full",
        )}
        style={{
          transform: getCardTransform(card.rotation, card.distance),
          transformOrigin: 'center center',
          aspectRatio: '11 / 17',
        }}
      >
        <div className="relative flex-grow">
          {!isHero && (
            <div className="absolute top-2 md:top-3 left-2 md:left-3 z-10 flex items-center gap-2">
              <div className="bg-black text-white rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-xs font-bold overflow-hidden relative">
                {card.authorImage ? (
                  <Image
                    src={card.authorImage}
                    alt={card.brand}
                    fill
                    sizes="28px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  card.brand.charAt(0)
                )}
              </div>
              <div className="text-xs font-semibold p-1 bg-white/50 backdrop-blur-sm rounded-md truncate">{card.brand}</div>
            </div>
          )}

          <Image
            src={card.image}
            alt={card.brand}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 40vw, 30vw"
            className="w-full h-full object-cover"
          />
          {/* Like count display */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-4 bg-black/40 text-white backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                <span className="font-bold text-sm">{card.likeCount}</span>
              </div>
              <Separator orientation="vertical" className="h-4 bg-white/30" />
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="font-bold text-sm">{card.viewCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          {card.type === 'series' && renderSeriesGrid(card.series)}

          {card.type === 'dots' && (
            <div className="flex justify-center gap-1 p-2 bg-white">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300 rounded-full"></div>
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300 rounded-full"></div>
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
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

            <div className="relative w-full flex items-center justify-center h-[200px] lg:h-[400px]">
                <Button
                variant="ghost"
                size="icon"
                onClick={() => handleScroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 lg:-left-12"
                >
                <ChevronLeft className="h-6 w-6" />
                </Button>
                <div ref={scrollContainerRef} className="w-full h-full overflow-y-hidden overflow-x-auto no-scrollbar">
                <div
                    ref={containerRef}
                    className="flex p-4 items-center gap-2 md:gap-3 lg:gap-4 h-full"
                    style={{
                    perspective: '1000px',
                    paddingLeft: 'calc(50% - 8rem)',
                    paddingRight: 'calc(50% - 8rem)',
                    } as React.CSSProperties}
                >
                    {cards.map(card => renderCard(card))}
                </div>
                </div>
                <Button
                variant="ghost"
                size="icon"
                onClick={() => handleScroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 lg:-right-12"
                >
                <ChevronRight className="h-6 w-6" />
                </Button>
            </div>
        </div>
    </div>
  );
}

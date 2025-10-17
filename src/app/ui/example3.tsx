

"use client"

import React, { useState, useEffect, useRef } from 'react';
import type { Post } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const getRandomValue = (min: number, max: number) => Math.random() * (max - min) + min;

export default function MetaSpotlight3({ posts: initialPosts }: { posts: Post[] }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    const generatedCards = initialPosts.slice(0, 10).map((post, index) => {
      const isSeriesPost = post.series && post.series.posts && post.series.posts.length > 0;
      const cardType = index === 2 ? 'hero' : (isSeriesPost ? 'series' : (index % 3 === 1 ? 'dots' : 'single'));

      return {
        id: post.id,
        image: post.posterUrl || `https://picsum.photos/seed/${post.id}/600/800`,
        brand: post.author?.name || 'CineVerse',
        authorImage: post.author?.image,
        series: post.series,
        type: cardType,
        rotation: index === 2 ? 0 : getRandomValue(-12, 12),
        distance: index === 2 ? 0.5 : getRandomValue(0.6, 0.8)
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
                  <Image src={post.posterUrl} alt="series post" layout="fill" objectFit="cover" />
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
          "flex-shrink-0 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-out"
        )}
        style={{
          transform: getCardTransform(card.rotation, card.distance),
          transformOrigin: 'center center',
          aspectRatio: '11 / 17',
          height: '100%',
        }}
      >
        {!isHero && (
          <div className="relative">
            <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-black text-white rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-xs font-bold z-10 overflow-hidden">
              {card.authorImage ? (
                <Image src={card.authorImage} alt={card.brand} layout="fill" objectFit="cover"  />
              ) : (
                card.brand.charAt(0)
              )}
            </div>
            <div className="text-xs font-semibold p-2 md:p-3 pt-2 truncate">{card.brand}</div>
          </div>
        )}
        
        <div className="relative w-full h-[65%]">
            <Image
              src={card.image}
              alt={card.brand}
              layout="fill"
              objectFit="cover"
            />
        </div>


        {card.type === 'series' && renderSeriesGrid(card.series)}
        
        {card.type === 'dots' && (
          <div className="flex justify-center gap-0 p-2 bg-white">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300 rounded-full"></div>
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full"></div>
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300 rounded-full"></div>
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-300 rounded-full"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-[290px] bg-gradient-to-br from-slate-800 via-blue-900 to-teal-800 flex flex-col items-center  justify-center overflow-hidden relative">
      <div className="absolute max-w-[500px] top-8 md:top-12 left-0 right-0 z-20 px-4 ">
        <h1 className="w-fit max-w-[500px] ml-12 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]" 
            style={{ textShadow: '0 30px 350px rgba(0,0,0,0.9), 0 2px 350px rgba(0,0,0,0.7)' }}>
          Put your <br />business in<br />the spotlight.
        </h1>
      </div>

      <div className="w-full h-[350px] flex items-center justify-center">
        <Button
            variant="ghost"
            size="icon"
            onClick={() => handleScroll('left')}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
        >
            <ChevronLeft className="h-6 w-6" />
        </Button>
        <div ref={scrollContainerRef} className="w-full py-8 overflow-y-hidden overflow-x-auto">
          <div
            ref={containerRef}
            className="flex bg-red-400 p-5 items-center gap-2 md:gap-2 lg:gap-2 h-[240px]"
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
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
        >
            <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute  bottom-8 md:bottom-12 left-0 right-0 flex z-20">
        <div className="flex items-center gap-2 md:gap-3 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          <div className="ml-[190px] text-white text-md md:text-1xl font-bold" style={{ textShadow: '0 54px 220px rgba(0,0,0,0.8)' }}>∞</div>
          <div className="ml-12 text-white text-md md:text-lg font-bold tracking-wide" style={{ textShadow: '0 34px 320px rgba(0,0,0,0.8)' }}>Walldriyan</div>
        </div>
      </div>
    </div>
  );
}

    
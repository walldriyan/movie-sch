"use client"

import React, { useState, useEffect, useRef } from 'react';
import type { Post } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// Helper function to get a random value in a range
const getRandomValue = (min: number, max: number) => Math.random() * (max - min) + min;


export default function MetaSpotlight({ posts: initialPosts }: { posts: Post[] }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    let postsToDisplay: Post[] = [];
    const numPosts = initialPosts.length;

    if (numPosts === 0) {
      setCards([]);
      return;
    }

    if (numPosts >= 10) {
      postsToDisplay = initialPosts.slice(0, 10);
    } else if (numPosts >= 5) {
      postsToDisplay = initialPosts;
    } else { // numPosts < 5
      postsToDisplay = [...initialPosts];
      // Duplicate posts to reach the minimum of 5
      let i = 0;
      while (postsToDisplay.length < 5) {
        postsToDisplay.push(initialPosts[i % numPosts]);
        i++;
      }
    }
    
    const cardConfigs = [
        { type: 'grid', rotation: -12, distance: 0.8, position: 'left-0 top-8' },
        { type: 'single', rotation: 6, distance: 0.7, position: 'left-2 bottom-8' },
        { type: 'hero', rotation: 0, distance: 0.5, position: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' },
        { type: 'dots', rotation: 12, distance: 0.8, position: 'right-0 top-8' },
        { type: 'single', rotation: -6, distance: 0.7, position: 'right-2 bottom-8' },
        { type: 'single', rotation: -8, distance: 0.6, position: 'left-20 top-32' },
        { type: 'grid', rotation: 8, distance: 0.6, position: 'right-20 top-32' },
        { type: 'single', rotation: 10, distance: 0.65, position: 'left-24 bottom-24' },
        { type: 'dots', rotation: -10, distance: 0.65, position: 'right-24 bottom-24' },
        { type: 'grid', rotation: -15, distance: 0.9, position: 'left-10 bottom-40' },
    ];


    const generatedCards = postsToDisplay.map((post, index) => {
      const config = cardConfigs[index % cardConfigs.length];
      const defaultImage = PlaceHolderImages.find(p => p.id === 'movie-poster-placeholder')?.imageUrl;
      const authorImageDefault = PlaceHolderImages.find(p => p.id === 'avatar-1')?.imageUrl;
      
      let gridColors: string[] = [];
      if (config.type === 'grid') {
        gridColors = ['bg-blue-400', 'bg-purple-400', 'bg-orange-500'];
      }
      
      return {
        id: `post-${post.id}-${index}`, // Unique key
        image: post.posterUrl || defaultImage,
        brand: post.author?.name || 'CineVerse',
        authorImage: post.author?.image || authorImageDefault,
        type: config.type,
        gridColors: gridColors,
        position: config.position,
        rotation: config.rotation,
        distance: config.distance,
      };
    });

    setCards(generatedCards);

  }, [initialPosts]);


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = (containerRef.current as HTMLElement).getBoundingClientRect();
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

    const container = containerRef.current as HTMLElement | null;
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

  const getCardTransform = (baseRotate: number, distanceMultiplier: number, isHeroCard = false) => {
    if (!isHovering) {
      return isHeroCard ? 'translate(-50%, -50%)' : `rotate(${baseRotate}deg)`;
    }
    const moveX = mousePos.x * 30 * distanceMultiplier;
    const moveY = mousePos.y * 30 * distanceMultiplier;
    const rotateAdjust = mousePos.x * 5;
    
    if (isHeroCard) {
      return `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px)) scale(1.02)`;
    }
    return `translate(${moveX}px, ${moveY}px) rotate(${baseRotate + rotateAdjust}deg)`;
  };
  
    const renderCard = (card: any) => {
    const isHero = card.type === 'hero';
    const cardWidth = isHero ? 'w-64 md:w-72' : 'w-32 md:w-36';
    const cardHeight = isHero ? 'h-[400px] md:h-[420px]' : 'h-44 md:h-52';

    return (
      <div
        key={card.id}
        className={`absolute ${card.position} bg-white rounded-2xl ${isHero ? 'rounded-3xl' : ''} shadow-2xl overflow-hidden transition-all duration-500 ease-out ${isHero ? 'z-10' : ''} ${cardWidth}`}
        style={{
          transform: getCardTransform(card.rotation, card.distance, isHero),
          transformOrigin: 'center center'
        }}
      >
        {!isHero && (
          <div className="relative">
            <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-black text-white rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-xs font-bold overflow-hidden">
               {card.authorImage ? (
                <img src={card.authorImage} alt={card.brand} className="w-full h-full object-cover" />
              ) : (
                card.brand.charAt(0)
              )}
            </div>
            <div className="text-xs font-semibold p-2 md:p-3 pt-2 truncate">{card.brand}</div>
          </div>
        )}

        <img
          src={card.image}
          alt={card.brand}
          className={`w-full object-cover ${cardHeight}`}
        />

        {card.type === 'grid' && (
          <div className="grid grid-cols-3 gap-2 p-2 md:p-3 bg-white">
            {card.gridColors.map((color: string, idx: number) => (
              <div key={idx} className={`${color} h-12 md:h-14 rounded`}></div>
            ))}
          </div>
        )}

        {card.type === 'dots' && (
          <div className="flex justify-center gap-1 p-2 bg-white">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="h-[520px] p-3  bg-gradient-to-r from-zinc-950 via-stone-900/20  to-zinc-950 flex flex-col items-center justify-center mb-1 overflow-hidden relative">
      {/* Text Overlay */}
      <div className="absolute top-12 left-0 right-0 text-start z-20 px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
          Put your business in<br />the spotlight.
        </h1>
      </div>

      {/* Cards Container */}
      <div className="flex flex-row gap-3 p-3 w-full justify-center">
      <div 
        ref={containerRef}
        className="relative  bg-gradient-to-r from-zinc-950 via-stone-900  to-zinc-950 rounded-2xl w-full max-w-[700px] h-[700px] flex items-center justify-center "
        style={{ perspective: '1000px' }}
      >
        {cards.map(card => renderCard(card))}
      </div>

      <div 
       
        className="relative  bg-gradient-to-r from-zinc-950 via-stone-900  to-zinc-950 rounded-2xl w-full max-w-[700px] h-[700px] flex items-center justify-center "
        style={{ perspective: '1000px' }}
      >
       groups card here
      </div>

      </div>

      {/* Meta Logo */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20">
        <div className="flex items-center gap-3">
          <div className="text-white text-5xl font-bold">∞</div>
          <div className="text-white text-3xl font-bold tracking-wide">Meta</div>
        </div>
      </div>
    </div>
  );
}

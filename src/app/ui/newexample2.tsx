
"use client"
import React, { useState, useEffect, useRef } from 'react';

export default function MetaSpotlight1() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);

  // Card data array
  const cards = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'grid',
      gridColors: ['bg-blue-400', 'bg-purple-400', 'bg-orange-500'],
      position: 'left-0 top-8',
      rotation: -12,
      distance: 0.8
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'single',
      position: 'left-2 bottom-8',
      rotation: 6,
      distance: 0.7
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=800&fit=crop',
      brand: 'Hero',
      type: 'hero',
      position: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
      rotation: 0,
      distance: 0.5
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'dots',
      position: 'right-0 top-8',
      rotation: 12,
      distance: 0.8
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'single',
      position: 'right-2 bottom-8',
      rotation: -6,
      distance: 0.7
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'single',
      position: 'left-20 top-32',
      rotation: -8,
      distance: 0.6
    },
    {
      id: 7,
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'grid',
      gridColors: ['bg-pink-400', 'bg-yellow-400', 'bg-green-400'],
      position: 'right-20 top-32',
      rotation: 8,
      distance: 0.6
    },
    {
      id: 8,
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'single',
      position: 'left-24 bottom-24',
      rotation: 10,
      distance: 0.65
    },
    {
      id: 9,
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'dots',
      position: 'right-24 bottom-24',
      rotation: -10,
      distance: 0.65
    }
  ];

  useEffect(() => {
    const handleMouseMove = (e) => {
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

  const getCardTransform = (baseRotate, distanceMultiplier, isHeroCard = false) => {
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

  const renderCard = (card) => {
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
            <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-black text-white rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-xs font-bold">
              W
            </div>
            <div className="text-xs font-semibold p-2 md:p-3 pt-2">Wind & Wool</div>
          </div>
        )}

        <img
          src={card.image}
          alt={card.brand}
          className={`w-full object-cover ${cardHeight}`}
        />

        {card.type === 'grid' && (
          <div className="grid grid-cols-3 gap-2 p-2 md:p-3 bg-white">
            {card.gridColors.map((color, idx) => (
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
    <div className="h-[250px] overflow-hidden relative bg-gradient-to-br from-slate-800 via-blue-900 to-teal-800 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative">
      {/* Text Overlay */}
      <div className="absolute top-8 md:top-12 left-0 right-0 text-center z-20 px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
          Put your business in<br />the spotlight.
        </h1>
      </div>

      {/* Cards Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[1000px] h-[500px] md:h-[600px] flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        {cards.map(card => renderCard(card))}
      </div>

      {/* Meta Logo */}
      <div className="absolute bottom-8 md:bottom-12 left-0 right-0 flex justify-center z-20">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-white text-4xl md:text-5xl font-bold">∞</div>
          <div className="text-white text-2xl md:text-3xl font-bold tracking-wide">Meta</div>
        </div>
      </div>
    </div>
  );
}
"use client"

import React, { useState, useEffect, useRef } from 'react';

export default function MetaSpotlight3() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);

  // Card data array - තවත් cards add කළා
  const cards = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'grid',
      gridColors: ['bg-blue-400', 'bg-purple-400', 'bg-orange-500'],
      rotation: -12,
      distance: 0.8
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'single',
      rotation: 6,
      distance: 0.7
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=800&fit=crop',
      brand: 'Hero',
      type: 'hero',
      rotation: 0,
      distance: 0.5
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'dots',
      rotation: 12,
      distance: 0.8
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'single',
      rotation: -6,
      distance: 0.7
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'single',
      rotation: -8,
      distance: 0.6
    },
    {
      id: 7,
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'grid',
      gridColors: ['bg-pink-400', 'bg-yellow-400', 'bg-green-400'],
      rotation: 8,
      distance: 0.6
    },
    {
      id: 8,
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'single',
      rotation: 10,
      distance: 0.65
    },
    {
      id: 9,
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'dots',
      rotation: -10,
      distance: 0.65
    },
    {
      id: 10,
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'grid',
      gridColors: ['bg-red-400', 'bg-blue-500', 'bg-green-500'],
      rotation: -7,
      distance: 0.75
    },
    {
      id: 11,
      image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'single',
      rotation: 9,
      distance: 0.7
    },
    {
      id: 12,
      image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'dots',
      rotation: -11,
      distance: 0.65
    },
    {
      id: 13,
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'single',
      rotation: 7,
      distance: 0.7
    },
    {
      id: 14,
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'grid',
      gridColors: ['bg-purple-500', 'bg-pink-400', 'bg-orange-400'],
      rotation: -9,
      distance: 0.8
    },
    {
      id: 15,
      image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop',
      brand: 'Wind & Wool',
      type: 'single',
      rotation: 11,
      distance: 0.6
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

  const getCardTransform = (baseRotate, distanceMultiplier) => {
    if (!isHovering) {
      return `rotate(${baseRotate}deg)`;
    }
    const moveX = mousePos.x * 30 * distanceMultiplier;
    const moveY = mousePos.y * 30 * distanceMultiplier;
    const rotateAdjust = mousePos.x * 5;
    
    return `translate(${moveX}px, ${moveY}px) rotate(${baseRotate + rotateAdjust}deg) scale(1.05)`;
  };

  const renderCard = (card) => {
    const isHero = card.type === 'hero';

    return (
      <div
        key={card.id}
        className={`flex-shrink-0 bg-white rounded-2xl ${isHero ? 'rounded-3xl' : ''} shadow-2xl overflow-hidden transition-all duration-500 ease-out
          ${isHero ? 'w-52 sm:w-60 md:w-64 lg:w-72' : 'w-32 sm:w-36 md:w-40 lg:w-44'}`}
        style={{
          transform: getCardTransform(card.rotation, card.distance),
          transformOrigin: 'center center'
        }}
      >
        {!isHero && (
          <div className="relative">
            <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-black text-white rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-xs font-bold z-10">
              W
            </div>
            <div className="text-xs font-semibold p-2 md:p-3 pt-2">Wind & Wool</div>
          </div>
        )}

        <img
          src={card.image}
          alt={card.brand}
          className={`w-full object-cover ${isHero ? 'h-64 sm:h-72 md:h-80 lg:h-96' : 'h-40 sm:h-44 md:h-48 lg:h-56'}`}
        />

        {card.type === 'grid' && (
          <div className="grid grid-cols-3 gap-1.5 md:gap-2 p-2 md:p-3 bg-white">
            {card.gridColors.map((color, idx) => (
              <div key={idx} className={`${color} h-10 md:h-12 lg:h-14 rounded`}></div>
            ))}
          </div>
        )}

        {card.type === 'dots' && (
          <div className="flex justify-center gap-1 p-2 bg-white">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-teal-800 flex flex-col items-center justify-center overflow-hidden relative">
      {/* Text Overlay - dark shadow එකක් දුන්නා */}
      <div className="absolute top-8 md:top-12 left-0 right-0 text-center z-20 px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]" 
            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)' }}>
          Put your business in<br />the spotlight.
        </h1>
      </div>

      {/* Cards Container - horizontal scroll එකක් */}
      <div className="w-full py-8 px-4 md:px-8 scrollbar-hide overflow-x-auto">
        <div
          ref={containerRef}
          className="flex gap-4 md:gap-6 lg:gap-8 overflow-x-auto pb-4 px-4 md:px-8"
          style={{ 
            perspective: '1000px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.3) transparent',
            paddingLeft: '100px',
            paddingRight: '100px'
          }}
        >
          {cards.map(card => renderCard(card))}
        </div>
      </div>

      {/* Meta Logo - dark shadow එකක් දුන්නා */}
      <div className="absolute bottom-8 md:bottom-12 left-0 right-0 flex justify-center z-20">
        <div className="flex items-center gap-2 md:gap-3 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          <div className="text-white text-4xl md:text-5xl font-bold" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>∞</div>
          <div className="text-white text-2xl md:text-3xl font-bold tracking-wide" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>Meta</div>
        </div>
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          height: 8px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  );
}
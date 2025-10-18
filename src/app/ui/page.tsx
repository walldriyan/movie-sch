
"use client"

import React from 'react';
import type { Post, User, GroupWithCount } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import GroupsUsersSpotlight from './groups-users-spotlight';
import { Skeleton } from '@/components/ui/skeleton';

// Helper function to get a random value in a range
const getRandomValue = (min: number, max: number) => Math.random() * (max - min) + min;

export default function MetaSpotlight({
  posts: initialPosts,
  users,
  groups,
}: {
  posts: Post[];
  users: User[];
  groups: (GroupWithCount & { posts: { posterUrl: string | null }[] })[]
}) {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);
  const containerRef = React.useRef(null);
  const [cards, setCards] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      let postsToDisplay = initialPosts.sort((a, b) => (b._count?.likedBy ?? 0) - (a._count?.likedBy ?? 0)).slice(0, 10);

      const generatedCards = postsToDisplay.map((post, index) => {
        const defaultImage = PlaceHolderImages.find(p => p.id === 'movie-poster-placeholder')?.imageUrl;
        const authorImageDefault = PlaceHolderImages.find(p => p.id === 'avatar-1')?.imageUrl;
        const isHeroIndex = postsToDisplay.length > 2 ? Math.floor(postsToDisplay.length / 2) : 0;
        const cardType = index === isHeroIndex ? 'hero' : (index % 3 === 1 ? 'dots' : 'single');

        const cardPositions = [
          'left-0 top-8', 'left-2 bottom-8', 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2', 'right-0 top-8', 'right-2 bottom-8',
          'left-20 top-32', 'right-20 top-32', 'left-24 bottom-24', 'right-24 bottom-24', 'left-10 bottom-40'
        ];

        return {
          id: `post-${post.id}-${index}`, // Unique key
          image: post.posterUrl || defaultImage,
          brand: post.author?.name || 'CineVerse',
          authorImage: post.author?.image || authorImageDefault,
          type: cardType,
          gridColors: ['bg-blue-400', 'bg-purple-400', 'bg-orange-500'],
          position: cardPositions[index % cardPositions.length],
          rotation: index === isHeroIndex ? 0 : getRandomValue(-15, 15),
          distance: index === isHeroIndex ? 0.5 : getRandomValue(0.6, 0.9),
        };
      });

      setCards(generatedCards);
      setLoading(false);
    }, 1000); // 1 second delay to show skeletons

    return () => clearTimeout(timer);
  }, [initialPosts]);


  React.useEffect(() => {
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
    const cardWidth = isHero ? 'w-48 md:w-56' : 'w-32 md:w-36';

    return (
      <div
        key={card.id}
        className={`absolute ${card.position} bg-white rounded-2xl ${isHero ? 'rounded-3xl' : ''} shadow-2xl overflow-hidden transition-all duration-500 ease-out ${isHero ? 'z-10' : ''} ${cardWidth} aspect-[11/17]`}
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
          className={`w-full object-cover ${isHero ? 'h-full' : 'h-[60%]'}`}
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
    <div className="h-[520px] p-3  bg-gradient-to-r from-zinc-950 via-cyan-950/5 to-zinc-950 drop-shadow-lg flex flex-col items-center justify-center mb-1 overflow-hidden relative">



      {/* Text Overlay */}
      <div className="absolute bottom-0 pb-5 left-0 right-0 text-center z-20 px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
          Put your business in<br />the spotlight.
        </h1>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
      </div>

      {/* Cards Container */}
      <div className="flex flex-row gap-3  p-3 w-full justify-center">
        <div
          ref={containerRef}
          className="relative rounded-2xl w-full max-w-[700px] h-[700px] flex items-center justify-center "
          style={{ perspective: '1000px' }}
        >
          {loading ? (
            // Render skeletons while loading
            Array.from({ length: 5 }).map((_, i) => {
              const isHero = i === 2;
              const cardWidth = isHero ? 'w-48 md:w-56' : 'w-32 md:w-36';
              const cardPositions = [
                'left-0 top-8', 'left-2 bottom-8', 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2', 'right-0 top-8', 'right-2 bottom-8'
              ];
              return (
                <Skeleton key={i} className={`absolute ${cardPositions[i]} ${cardWidth} aspect-[11/17] rounded-2xl ${isHero ? 'z-10' : ''}`} />
              )
            })
          ) : (
            cards.map(card => renderCard(card))
          )}
        </div>

        <GroupsUsersSpotlight users={users} groups={groups} loading={loading} />

      </div>

      {/* Meta Logo */}
      <div className="absolute bottom-[150px] left-0 right-0 flex justify-center z-20">
        <div className="flex items-center gap-3">
          <div className="text-white text-5xl font-bold">∞</div>
          <div className="text-white text-3xl font-bold tracking-wide">Walldriyan.inc</div>
        </div>
      </div>
    </div>
  );
}

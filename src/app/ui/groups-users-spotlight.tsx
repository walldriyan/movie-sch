
"use client"

import React from 'react';
import type { User, GroupWithCount } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

const getRandomValue = (min: number, max: number) => Math.random() * (max - min) + min;

export default function GroupsUsersSpotlight({ users, groups, loading }: {
  users: User[];
  groups: (GroupWithCount & { posts: { posterUrl: string | null }[] })[]
  loading: boolean;
}) {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);
  const containerRef = React.useRef(null);
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    const userItems = users.slice(0, 5).map(user => ({
      type: 'user',
      id: `user-${user.id}`,
      image: user.image || PlaceHolderImages.find(p => p.id === 'avatar-1')?.imageUrl,
      name: user.name,
      rotation: getRandomValue(-25, 25),
      distance: getRandomValue(0.7, 1),
    }));

    const groupItems = groups.slice(0, 4).map(group => ({
      type: 'group',
      id: `group-${group.id}`,
      image: group.profilePhoto || group.posts[0]?.posterUrl || PlaceHolderImages.find(p => p.id === 'movie-poster-placeholder')?.imageUrl,
      name: group.name,
      rotation: getRandomValue(-15, 15),
      distance: getRandomValue(0.6, 0.8),
    }));

    setItems([...userItems, ...groupItems].sort(() => Math.random() - 0.5));
  }, [users, groups]);

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

  const getTransform = (baseRotate: number, distanceMultiplier: number) => {
    if (!isHovering) {
      return `rotate(${baseRotate}deg)`;
    }
    const moveX = mousePos.x * 40 * distanceMultiplier;
    const moveY = mousePos.y * 40 * distanceMultiplier;
    const rotateAdjust = mousePos.x * 8;
    return `translate(${moveX}px, ${moveY}px) rotate(${baseRotate + rotateAdjust}deg) scale(1.05)`;
  };
  
  const positionClasses = [
      'top-1/4 left-1/4', 'top-1/2 right-1/4', 'bottom-1/4 left-1/2', 'top-1/3 right-1/3',
      'bottom-1/3 left-1/4', 'top-1/2 left-1/3', 'bottom-1/4 right-1/2', 'top-1/4 right-1/4',
      'bottom-1/2 left-1/2'
  ];

  const renderItem = (item: any, index: number) => {
    if (item.type === 'user') {
      return (
        <div
          key={item.id}
          className={`absolute ${positionClasses[index % positionClasses.length]} -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out`}
          style={{ transform: getTransform(item.rotation, item.distance) }}
        >
          <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-white shadow-lg">
            <AvatarImage src={item.image} alt={item.name || 'User'} />
            <AvatarFallback>{item.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </div>
      );
    }

    if (item.type === 'group') {
      return (
        <div
          key={item.id}
          className={`absolute ${positionClasses[index % positionClasses.length]} bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-500 ease-out w-40 md:w-48 -translate-x-1/2 -translate-y-1/2`}
          style={{
            transform: getTransform(item.rotation, item.distance),
            height: '200px',
            aspectRatio: '11/17',
          }}
        >
          <div className="relative w-full h-full">
            <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <p className="absolute bottom-2 left-2 text-white font-bold text-sm truncate">{item.name}</p>
          </div>
        </div>
      );
    }

    return null;
  };
  
  const renderSkeletons = () => {
    return Array.from({ length: 9 }).map((_, index) => {
        const isUser = index % 2 === 0;
        const rotation = getRandomValue(-25, 25);
        if (isUser) {
           return (
                <div
                key={`skeleton-user-${index}`}
                className={`absolute ${positionClasses[index % positionClasses.length]} -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out`}
                style={{ transform: `rotate(${rotation}deg)` }}
                >
                    <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full" />
                </div>
            )
        } else {
             return (
                <div
                key={`skeleton-group-${index}`}
                className={`absolute ${positionClasses[index % positionClasses.length]} bg-muted rounded-lg shadow-xl overflow-hidden transition-all duration-500 ease-out w-40 md:w-48 -translate-x-1/2 -translate-y-1/2`}
                style={{
                    transform: `rotate(${rotation}deg)`,
                    height: '200px',
                    aspectRatio: '11/17',
                }}
                >
                    <Skeleton className="w-full h-full" />
                </div>
            )
        }
    });
  }

  // bg-gradient-to-r from-zinc-950 via-stone-900 to-zinc-950
  return (
    <div
      ref={containerRef}
      className="relative bg-gradient-to-r from-zinc-950/80 via-stone-900 to-zinc-950/50  rounded-2xl w-full max-w-[700px] h-[700px] flex items-center justify-center"
      style={{ perspective: '1000px' }}
    >
      {loading ? renderSkeletons() : items.map((item, index) => renderItem(item, index))}
    </div>
  );
}

// "use client"

// import React, { useState, useEffect } from 'react';

// export default function MetaSpotlight() {
//   const [hoveredCard, setHoveredCard] = useState(null);

//   // Simulate card rotation animation
//   useEffect(() => {
//     const interval = setInterval(() => {
//       const cards = document.querySelectorAll('.floating-card');
//       cards.forEach((card, index) => {
//         const randomDelay = Math.random() * 2000;
//         setTimeout(() => {
//           card.style.transform = `translateY(${Math.sin(Date.now() / 1000 + index) * 10}px) rotate(${Math.sin(Date.now() / 2000 + index) * 3}deg)`;
//         }, randomDelay);
//       });
//     }, 100);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-teal-800 flex items-center justify-center p-8 overflow-hidden relative">
//       {/* Background Cards - Left Side */}
//       <div className="floating-card absolute left-8 top-20 w-40 bg-white rounded-2xl shadow-2xl overflow-hidden transform -rotate-12 transition-all duration-300">
//         <div className="relative">
//           <div className="absolute top-3 left-3 bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
//             W
//           </div>
//           <div className="text-xs font-semibold p-3 pt-2">Wind & Wool</div>
//         </div>
//         <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop" alt="Portrait" className="w-full h-48 object-cover" />
//         <div className="grid grid-cols-3 gap-2 p-3 bg-white">
//           <div className="bg-blue-400 h-16 rounded"></div>
//           <div className="bg-purple-400 h-16 rounded"></div>
//           <div className="bg-orange-500 h-16 rounded"></div>
//         </div>
//       </div>

//       <div className="floating-card absolute left-4 bottom-32 w-40 bg-white rounded-2xl shadow-2xl overflow-hidden transform rotate-6 transition-all duration-300">
//         <div className="relative">
//           <div className="absolute top-3 left-3 bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
//             W
//           </div>
//           <div className="text-xs font-semibold p-3 pt-2">Wind & Wool</div>
//         </div>
//         <img src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop" alt="Orange bag" className="w-full h-56 object-cover" />
//       </div>

//       {/* Center Hero Card */}
//       <div className="relative z-10 floating-card">
//         <div className="w-72 bg-white rounded-3xl shadow-2xl overflow-hidden">
//           <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=800&fit=crop" alt="Fashion" className="w-full h-96 object-cover" />
//         </div>
//       </div>

//       {/* Background Cards - Right Side */}
//       <div className="floating-card absolute right-8 top-20 w-40 bg-white rounded-2xl shadow-2xl overflow-hidden transform rotate-12 transition-all duration-300">
//         <div className="relative">
//           <div className="absolute top-3 left-3 bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
//             W
//           </div>
//           <div className="text-xs font-semibold p-3 pt-2">Wind & Wool</div>
//         </div>
//         <div className="bg-gradient-to-br from-yellow-400 to-purple-500 w-full h-48 flex items-center justify-center">
//           <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" alt="Portrait" className="w-full h-full object-cover" />
//         </div>
//         <div className="flex justify-center gap-1 p-2 bg-white">
//           <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
//           <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
//           <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
//           <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
//         </div>
//       </div>

//       <div className="floating-card absolute right-4 bottom-32 w-40 bg-white rounded-2xl shadow-2xl overflow-hidden transform -rotate-6 transition-all duration-300">
//         <div className="relative">
//           <div className="absolute top-3 left-3 bg-black text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
//             W
//           </div>
//           <div className="text-xs font-semibold p-3 pt-2">Wind & Wool</div>
//         </div>
//         <div className="bg-gradient-to-br from-orange-400 to-yellow-500 w-full h-56 flex items-center justify-center">
//           <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" alt="Sunglasses" className="w-full h-full object-cover" />
//         </div>
//       </div>

//       {/* Text Overlay */}
//       <div className="absolute top-12 left-0 right-0 text-center z-20 px-4">
//         <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
//           Put your business in<br />the spotlight.
//         </h1>
//       </div>

//       {/* Meta Logo */}
//       <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20">
//         <div className="flex items-center gap-3">
//           <div className="text-white text-5xl font-bold">∞</div>
//           <div className="text-white text-3xl font-bold tracking-wide">Meta</div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client"

import React, { useState, useEffect, useRef } from 'react';

export default function MetaSpotlight() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);

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
    return `translate(${moveX}px, ${moveY}px) rotate(${baseRotate + rotateAdjust}deg)`;
  };

  return (
    <div className="h-[420px] bg-gradient-to-br from-slate-800 via-blue-900 to-teal-800 flex flex-col items-center justify-center p-8 overflow-hidden relative">
      {/* Text Overlay */}
      <div className="absolute top-12 left-0 right-0 text-center z-20 px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          Put your business in<br />the spotlight.
        </h1>
      </div>

      {/* Cards Container */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-[700px] h-[600px] flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        {/* Background Card - Top Left */}
        <div 
          className="absolute left-0 top-8 w-36 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-out"
          style={{ 
            transform: getCardTransform(-12, 0.8),
            transformOrigin: 'center center'
          }}
        >
          <div className="relative">
            <div className="absolute top-3 left-3 bg-black text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
              W
            </div>
            <div className="text-xs font-semibold p-3 pt-2">Wind & Wool</div>
          </div>
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop" alt="Portrait" className="w-full h-44 object-cover" />
          <div className="grid grid-cols-3 gap-2 p-3 bg-white">
            <div className="bg-blue-400 h-14 rounded"></div>
            <div className="bg-purple-400 h-14 rounded"></div>
            <div className="bg-orange-500 h-14 rounded"></div>
          </div>
        </div>

        {/* Background Card - Bottom Left */}
        <div 
          className="absolute left-2 bottom-8 w-36 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-out"
          style={{ 
            transform: getCardTransform(6, 0.7),
            transformOrigin: 'center center'
          }}
        >
          <div className="relative">
            <div className="absolute top-3 left-3 bg-black text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
              W
            </div>
            <div className="text-xs font-semibold p-3 pt-2">Wind & Wool</div>
          </div>
          <img src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop" alt="Orange bag" className="w-full h-52 object-cover" />
        </div>

        {/* Center Hero Card */}
        <div 
          className="relative z-10 transition-all duration-500 ease-out"
          style={{ 
            transform: isHovering 
              ? `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px) scale(1.02)` 
              : 'translate(0, 0) scale(1)',
            transformOrigin: 'center center'
          }}
        >
          <div className="w-64 bg-white rounded-3xl shadow-2xl overflow-hidden">
            <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=800&fit=crop" alt="Fashion" className="w-full h-[420px] object-cover" />
          </div>
        </div>

        {/* Background Card - Top Right */}
        <div 
          className="absolute right-0 top-8 w-36 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-out"
          style={{ 
            transform: getCardTransform(12, 0.8),
            transformOrigin: 'center center'
          }}
        >
          <div className="relative">
            <div className="absolute top-3 left-3 bg-black text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
              W
            </div>
            <div className="text-xs font-semibold p-3 pt-2">Wind & Wool</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-purple-500 w-full h-44 flex items-center justify-center">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" alt="Portrait" className="w-full h-full object-cover" />
          </div>
          <div className="flex justify-center gap-1 p-2 bg-white">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Background Card - Bottom Right */}
        <div 
          className="absolute right-2 bottom-8 w-36 bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ease-out"
          style={{ 
            transform: getCardTransform(-6, 0.7),
            transformOrigin: 'center center'
          }}
        >
          <div className="relative">
            <div className="absolute top-3 left-3 bg-black text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
              W
            </div>
            <div className="text-xs font-semibold p-3 pt-2">Wind & Wool</div>
          </div>
          <div className="bg-gradient-to-br from-orange-400 to-yellow-500 w-full h-52 flex items-center justify-center">
            <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" alt="Sunglasses" className="w-full h-full object-cover" />
          </div>
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
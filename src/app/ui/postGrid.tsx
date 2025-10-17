
"use client"

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Copyright, Mail, MapPin, Phone } from 'lucide-react';


export default function MetaSpotlightPostGrid() {
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
    <div className="h-[320px] bg-gradient-to-r from-zinc-950 via-stone-900/20  to-zinc-950 flex flex-col items-center justify-center mb-1 p-8 overflow-hidden relative">
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

      {/* Footer Section */}
      <footer className="absolute bottom-0 left-0 right-0 p-8 text-white bg-gradient-to-t from-black via-black/70 to-transparent z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-2">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="mailto:info@cineverse.com" className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" /> info@cineverse.com</Link></li>
              <li><Link href="tel:+123456789" className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" /> +1 (234) 567-89</Link></li>
            </ul>
          </div>
          {/* Address */}
          <div>
            <h3 className="font-semibold mb-2">Address</h3>
            <div className="text-sm text-muted-foreground flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                <p>123 Movie Lane,<br/>Hollywood, CA 90210</p>
            </div>
          </div>
          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-2">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Cookie Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
          {/* Socials */}
           <div>
            <h3 className="font-semibold mb-2">Socials</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Facebook</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Twitter</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Instagram</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/10 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Copyright className="h-4 w-4" />
            <span>{new Date().getFullYear()} CineVerse. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

    
'use client';

import React, { useEffect, useState } from 'react';
import { ChefHat, Sparkles, Utensils, Flame, Bot } from 'lucide-react';

// Pot Types
type PotType = 'pan' | 'stew' | 'magic';

const CookingAnimation = () => {
  const [potType, setPotType] = useState<PotType>('pan');
  const [message, setMessage] = useState('正在构思美味食谱...');

  // Randomly select a pot on mount
  useEffect(() => {
    const types: PotType[] = ['pan', 'stew', 'magic'];
    setPotType(types[Math.floor(Math.random() * types.length)]);

    // Message rotation
    const messages = [
      '正在挑选最佳食材...',
      '正在计算营养搭配...',
      '正在调味...',
      '即将完成...'
    ];
    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setMessage(messages[msgIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Pot Content
  const renderPot = () => {
    switch (potType) {
      case 'pan':
        return (
          <div className="relative">
            {/* Pan Body */}
            <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center relative z-10 animate-pot-rock border-b-8 border-gray-900 shadow-xl">
               {/* Inner Surface */}
               <div className="w-28 h-28 bg-gray-700 rounded-full relative overflow-hidden flex items-center justify-center">
                  {/* Ingredients jumping inside */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="text-3xl animate-jump absolute left-8 top-10" style={{ animationDelay: '0s' }}>🥦</span>
                     <span className="text-3xl animate-jump absolute left-14 top-12" style={{ animationDelay: '0.3s' }}>🥩</span>
                     <span className="text-3xl animate-jump absolute left-6 top-16" style={{ animationDelay: '0.6s' }}>🥕</span>
                  </div>
               </div>
               {/* Handle */}
               <div className="absolute left-full top-1/2 -translate-y-1/2 w-24 h-6 bg-gray-800 rounded-r-xl border-b-4 border-gray-900 origin-left transform -rotate-6"></div>
            </div>
          </div>
        );
      case 'stew':
        return (
          <div className="relative pt-6">
             {/* Stew Pot Body */}
             <div className="w-36 h-28 bg-red-400 rounded-b-[2rem] rounded-t-lg relative z-10 animate-pot-rock border-b-4 border-red-600 shadow-xl flex items-center justify-center">
                {/* Lid (slightly open/bouncing) */}
                <div className="absolute -top-5 w-38 h-10 bg-red-500 rounded-t-full animate-bounce-slow origin-bottom z-20 flex justify-center items-start pt-1 border-b border-black/10">
                    <div className="w-6 h-4 bg-red-700 rounded-full -mt-3 shadow-sm"></div>
                </div>
                {/* Pot Handles */}
                <div className="absolute -left-3 top-8 w-3 h-8 bg-red-600 rounded-l-lg shadow-sm"></div>
                <div className="absolute -right-3 top-8 w-3 h-8 bg-red-600 rounded-r-lg shadow-sm"></div>
                
                {/* Pattern */}
                <div className="text-white/40 text-5xl">🍲</div>
             </div>
          </div>
        );
      case 'magic':
        return (
          <div className="relative pt-4">
             {/* Cauldron Body */}
             <div className="w-32 h-28 bg-purple-600 rounded-b-[3rem] rounded-t-xl relative z-10 animate-pot-rock border-b-4 border-purple-800 shadow-xl flex items-center justify-center overflow-hidden">
                {/* Bubbling Potion */}
                <div className="absolute top-4 w-24 h-6 bg-green-400 rounded-full blur-md animate-pulse"></div>
                <div className="text-5xl animate-spin-slow opacity-80 mt-4">✨</div>
             </div>
             {/* Rim */}
             <div className="absolute top-4 w-36 h-6 bg-purple-700 rounded-full z-10 left-1/2 -translate-x-1/2 border-b border-purple-900"></div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 w-full max-w-md bg-white/60 rounded-[2rem] backdrop-blur-md shadow-2xl shadow-orange-100/50 border border-white/60 relative overflow-hidden">
       {/* Background Glow */}
       <div className="absolute inset-0 bg-gradient-to-b from-white/0 to-orange-50/80 pointer-events-none"></div>

       {/* Anthropomorphic Chef Hat */}
       <div className="absolute top-8 z-30 animate-bounce-slight" style={{ animationDuration: '3s' }}>
          <ChefHat size={48} className="text-white fill-[var(--primary)] drop-shadow-md stroke-orange-600 stroke-[1.5]" />
       </div>

       {/* Main Animation Container */}
       <div className="relative mt-12 mb-10 scale-110 transform">
          {/* Steam & Particles */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex justify-center w-full h-32 pointer-events-none z-0">
             <div className="animate-steam text-white/60 absolute left-1/2 -translate-x-6 text-3xl blur-sm" style={{ animationDelay: '0s' }}>☁️</div>
             <div className="animate-steam text-white/60 absolute left-1/2 translate-x-4 top-4 text-2xl blur-sm" style={{ animationDelay: '0.5s' }}>☁️</div>
             <div className="animate-steam text-yellow-400 absolute left-1/2 -translate-x-10 -top-8 text-lg" style={{ animationDelay: '0.2s' }}>⭐</div>
             <div className="animate-steam text-yellow-400 absolute left-1/2 translate-x-8 -top-4 text-lg" style={{ animationDelay: '0.7s' }}>✨</div>
             <div className="animate-steam text-blue-200 absolute left-1/2 -translate-x-2 -top-12 text-sm" style={{ animationDelay: '1.2s' }}>⚪</div>
          </div>

          {/* The Pot */}
          {renderPot()}

          {/* Fire at bottom */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-end justify-center gap-1 z-0 opacity-90 scale-110">
             <Flame size={28} className="text-orange-500 animate-flicker fill-orange-500" style={{ animationDelay: '0s' }} />
             <Flame size={32} className="text-red-500 animate-flicker fill-red-500" style={{ animationDelay: '0.1s' }} />
             <Flame size={28} className="text-yellow-500 animate-flicker fill-yellow-500" style={{ animationDelay: '0.2s' }} />
          </div>

          {/* Spatula (Only for Pan) */}
          {potType === 'pan' && (
             <div className="absolute -right-6 -top-10 animate-stir origin-bottom-left z-20 pointer-events-none">
                <Utensils size={56} className="text-gray-300 fill-gray-100 rotate-12 drop-shadow-sm stroke-gray-400" />
             </div>
          )}
          
          {/* AI Helper (Floating nearby) */}
          <div className="absolute -right-20 -top-8 animate-float-slow hidden sm:block">
             <div className="bg-white p-2.5 rounded-2xl border border-blue-100 shadow-sm relative group">
                <Bot size={24} className="text-blue-500" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white"></div>
                
                {/* Chat Bubble */}
                <div className="absolute -top-8 -right-4 bg-white px-3 py-1 rounded-xl rounded-bl-none shadow-sm border border-gray-100 text-[10px] font-bold text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity animate-fade-in" style={{ animationDelay: '1s', opacity: 1 }}>
                   AI Cooking...
                </div>
             </div>
          </div>
       </div>

       {/* Text Status */}
       <div className="text-center relative z-10 mt-2 px-6">
          <h3 className="text-xl font-black text-gray-700 mb-2 flex items-center justify-center gap-2">
             {message}
          </h3>
          <div className="flex justify-center gap-1.5 h-2 mb-2">
             <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
             <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
             <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
          </div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Powered by AI Chef</p>
       </div>
    </div>
  );
};

export default CookingAnimation;

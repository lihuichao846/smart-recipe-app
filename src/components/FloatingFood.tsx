'use client';

import React, { useEffect, useState } from 'react';

const FOODS = ['🥦', '🥕', '🥩', '🥚', '🧀', '🍎', '🍇', '🌽', '🥬', '🍗'];

interface FoodItem {
  icon: string;
  style: React.CSSProperties;
}

const FloatingFood = () => {
  const [items, setItems] = useState<FoodItem[]>([]);

  useEffect(() => {
    const newItems = FOODS.map((food) => ({
      icon: food,
      style: {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${10 + Math.random() * 10}s`,
      },
    }));
    setItems(newItems);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Warm Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-green-100/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-100/30 rounded-full blur-3xl -z-10"></div>
      
      {items.map((item, i) => (
        <div
          key={i}
          className="absolute animate-float opacity-20 text-4xl select-none"
          style={item.style}
        >
          {item.icon}
        </div>
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -50px) rotate(10deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
      `}} />
    </div>
  );
};

export default React.memo(FloatingFood);

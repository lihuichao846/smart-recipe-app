'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { AlertTriangle, Info, X, Sparkles, Loader2, Droplets, Snowflake } from 'lucide-react';
import { Ingredient } from '@/lib/db';
import { differenceInDays, isPast, isToday } from 'date-fns';

interface AIRobotProps {
  ingredients: Ingredient[];
  isGeneratingRecipe?: boolean;
  onRecipeGenerated?: () => void;
  activeTab?: 'fridge' | 'freezer';
}

export default function AIRobot({ ingredients, isGeneratingRecipe = false, onRecipeGenerated, activeTab = 'fridge' }: AIRobotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'normal' | 'warning' | 'danger' | 'thinking' | 'success'>('normal');
  const [hasShownInitialMessage, setHasShownInitialMessage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [justSwitchedTab, setJustSwitchedTab] = useState(false);
  const dragControls = useDragControls();

  // Watch for tab switching
  useEffect(() => {
    if (hasShownInitialMessage) { // Don't trigger on initial mount
      setJustSwitchedTab(true);
      setIsOpen(true);
      setStatus('normal');
      
      if (activeTab === 'fridge') {
        setMessage('冷藏区状态清爽，蔬菜水果都很新鲜哦～');
      } else {
        setMessage('冷冻区有点冷～我来检查一下库存！');
      }
      
      const timer1 = setTimeout(() => setJustSwitchedTab(false), 1500); // Stop "shivering" or "sliding" after 1.5s
      const timer2 = setTimeout(() => {
        setIsOpen(false);
        analyzeIngredients(); // Re-analyze after showing tab message
      }, 4000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [activeTab]);

  const analyzeIngredients = React.useCallback(() => {
    if (!ingredients) return;
    
    let expiredCount = 0;
    let expiringSoonCount = 0;
    const expiringSoonNames: string[] = [];

    ingredients.forEach(item => {
      if (!item.expiryDate || item.storage === 'freezer') return;
      
      const daysLeft = differenceInDays(new Date(item.expiryDate), new Date());
      
      if (isPast(new Date(item.expiryDate)) && !isToday(new Date(item.expiryDate))) {
        expiredCount++;
      } else if (daysLeft >= 0 && daysLeft <= 3) {
        expiringSoonCount++;
        expiringSoonNames.push(item.name);
      }
    });

    if (ingredients.length === 0) {
      setStatus('danger');
      setMessage('冰箱空空如也，主人快去采购吧！');
    } else if (expiredCount > 0) {
      setStatus('danger');
      setMessage(`警告：冰箱里有 ${expiredCount} 样食材已经过期了，请尽快清理！`);
    } else if (expiringSoonCount > 0) {
      setStatus('warning');
      if (expiringSoonCount === 1) {
        setMessage(`提醒：你的【${expiringSoonNames[0]}】快过期了，记得这几天吃掉哦！`);
      } else {
        setMessage(`提醒：有 ${expiringSoonCount} 样食材（包括 ${expiringSoonNames[0]} 等）即将过期，建议今晚做个清冰箱大餐！`);
      }
    } else {
      setStatus('normal');
      setMessage('冰箱状况良好，食材都很新鲜~ 继续保持！');
    }

    // Automatically show message briefly when ingredients update if it's a warning/danger, 
    // or if it's the first load
    if (!hasShownInitialMessage || (expiredCount > 0 || expiringSoonCount > 0)) {
      setIsOpen(true);
      setHasShownInitialMessage(true);
      
      // Auto hide after 8 seconds
      const timer = setTimeout(() => setIsOpen(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [ingredients, hasShownInitialMessage]); // Add dependencies for useCallback

  // Watch for external state changes
  useEffect(() => {
    if (isGeneratingRecipe) {
      setStatus('thinking');
      setMessage('正在为您的大脑运转中，生成绝佳菜谱...');
      setIsOpen(true);
    } else if (status === 'thinking' && !isGeneratingRecipe) {
      // Just finished generating
      setStatus('success');
      setMessage('菜谱生成成功！快去看看吧~');
      setIsOpen(true);
      
      const timer = setTimeout(() => {
        analyzeIngredients(); // Revert back to normal state
        if (onRecipeGenerated) onRecipeGenerated();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isGeneratingRecipe, status, analyzeIngredients, onRecipeGenerated]);

  useEffect(() => {
    if (status !== 'thinking' && status !== 'success') {
      analyzeIngredients();
    }
  }, [ingredients, status, analyzeIngredients]);

  const handleInteraction = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
      if (!isOpen && status !== 'thinking' && status !== 'success') {
          analyzeIngredients();
      }
    }
  };

  // Render Face based on status
  const renderFace = () => {
    if (status === 'normal' || status === 'warning') {
      // Normal/Warning face with blinking animation
      const eyeColor = status === 'normal' ? 'bg-green-400' : 'bg-amber-400';
      const glowColor = status === 'normal' ? 'shadow-[0_0_8px_#4ade80]' : 'shadow-[0_0_8px_#fbbf24]';
      return (
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <div className="flex gap-3">
            <motion.div 
              animate={{ scaleY: [1, 1, 0.1, 1, 1] }} 
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1, 1] }}
              className={`w-2.5 h-2.5 ${eyeColor} rounded-full ${glowColor}`}
            />
            <motion.div 
              animate={{ scaleY: [1, 1, 0.1, 1, 1] }} 
              transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1, 1] }}
              className={`w-2.5 h-2.5 ${eyeColor} rounded-full ${glowColor}`}
            />
          </div>
          <div className={`w-4 h-1.5 ${eyeColor} rounded-full mt-1.5 ${glowColor}`} style={{ borderRadius: '0 0 10px 10px' }}></div>
        </div>
      );
    }
    
    if (status === 'danger') {
      if (ingredients.length === 0) {
        // Crying face
        return (
          <div className="flex flex-col items-center justify-center h-full gap-1 relative">
            <div className="flex gap-3">
              <div className="w-3 h-1 bg-blue-400 rounded-full shadow-[0_0_5px_#60a5fa] transform rotate-12"></div>
              <div className="w-3 h-1 bg-blue-400 rounded-full shadow-[0_0_5px_#60a5fa] transform -rotate-12"></div>
            </div>
            <div className="absolute top-3 left-1.5 w-1 h-2 bg-blue-400 rounded-full animate-bounce shadow-[0_0_5px_#60a5fa]"></div>
            <div className="absolute top-3 right-1.5 w-1 h-2 bg-blue-400 rounded-full animate-bounce shadow-[0_0_5px_#60a5fa]" style={{ animationDelay: '0.3s' }}></div>
            <div className="w-3 h-1.5 bg-blue-400 rounded-full mt-1 shadow-[0_0_5px_#60a5fa]" style={{ borderRadius: '10px 10px 0 0' }}></div>
          </div>
        );
      }
      
      // Dead/Expired face
      return (
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <div className="flex gap-2">
            <div className="relative w-3 h-3">
              <div className="absolute w-full h-0.5 bg-red-400 rotate-45 top-1 shadow-[0_0_5px_#f87171]"></div>
              <div className="absolute w-full h-0.5 bg-red-400 -rotate-45 top-1 shadow-[0_0_5px_#f87171]"></div>
            </div>
            <div className="relative w-3 h-3">
              <div className="absolute w-full h-0.5 bg-red-400 rotate-45 top-1 shadow-[0_0_5px_#f87171]"></div>
              <div className="absolute w-full h-0.5 bg-red-400 -rotate-45 top-1 shadow-[0_0_5px_#f87171]"></div>
            </div>
          </div>
          <div className="w-4 h-1 bg-red-400 rounded-full mt-1 shadow-[0_0_5px_#f87171]"></div>
        </div>
      );
    }
    
    // Success face (Happy smiling eyes)
    if (status === 'success') {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-1">
          <div className="flex gap-3">
            <div className="w-3 h-1.5 bg-green-400 rounded-t-full shadow-[0_0_8px_#4ade80]"></div>
            <div className="w-3 h-1.5 bg-green-400 rounded-t-full shadow-[0_0_8px_#4ade80]"></div>
          </div>
          <div className="w-4 h-2 bg-green-400 rounded-b-full mt-1.5 shadow-[0_0_5px_#4ade80]"></div>
        </div>
      );
    }
    
    // Thinking face (Loading/Generating)
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 size={20} className="text-blue-400 animate-spin shadow-[0_0_8px_#60a5fa] rounded-full" />
      </div>
    );
  };

  const iconColor = status === 'danger' ? 'text-red-500' : status === 'warning' ? 'text-amber-500' : status === 'success' ? 'text-green-500' : 'text-blue-500';

  // Define animation variants based on state
  const robotVariants: any = {
    idle: {
      y: [0, -12, 0],
      rotate: [0, -2, 2, 0],
      transition: { 
        y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" }
      }
    },
    hover: {
      scale: 1.05,
      y: [0, -12, 0],
      rotate: 0,
      transition: { 
        scale: { type: 'spring', stiffness: 400, damping: 10 },
        y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
      }
    },
    alert: {
      y: [0, -5, 0],
      rotate: [0, -5, 5, -5, 5, 0],
      transition: { duration: 0.5, repeat: 1 }
    },
    thinking: {
      y: 0,
      scale: 0.98,
      transition: { duration: 0.3 }
    },
    success: {
      y: [0, -20, 0, -10, 0],
      scale: [1, 1.1, 1, 1.05, 1],
      transition: { duration: 0.8, ease: "easeOut" }
    },
    drag: {
      scale: 1.1,
      rotate: 5,
      cursor: "grabbing"
    },
    slideIn: {
      x: [20, 0],
      y: [0, 0],
      rotate: [10, 0],
      transition: { duration: 0.8, type: "spring", bounce: 0.5 }
    },
    shiver: {
      x: [0, -3, 3, -3, 3, 0],
      y: [0, -2, 2, -2, 2, 0],
      transition: { duration: 0.3, repeat: 3 }
    }
  };

  // Arm animations
  const armLeftVariants: any = {
    idle: { rotate: -12 },
    hover: { rotate: [-12, -45, -12, -45, -12], transition: { duration: 1.5, repeat: Infinity } },
    thinking: { rotate: -30, x: 2, y: -2 }, // Hand on chin pose
    success: { rotate: -80, transition: { type: 'spring', bounce: 0.6 } }, // Arms wide open
    slideIn: { rotate: [-12, -60, -12], transition: { duration: 0.8 } },
    shiver: { rotate: [-12, -5, -20, -12], transition: { duration: 0.2, repeat: 4 } }
  };

  const armRightVariants: any = {
    idle: { rotate: 12 },
    hover: { rotate: 12 },
    thinking: { rotate: 30, x: -2, y: -2 },
    success: { rotate: 80, transition: { type: 'spring', bounce: 0.6 } }, // Arms wide open
    slideIn: { rotate: [12, 60, 12], transition: { duration: 0.8 } },
    shiver: { rotate: [12, 5, 20, 12], transition: { duration: 0.2, repeat: 4 } }
  };

  // Determine current animation state
  let currentAnimState = 'idle';
  if (isDragging) currentAnimState = 'drag';
  else if (status === 'success') currentAnimState = 'success';
  else if (status === 'thinking') currentAnimState = 'thinking';
  else if (justSwitchedTab) {
    currentAnimState = activeTab === 'fridge' ? 'slideIn' : 'shiver';
  }
  else if (status === 'danger' || status === 'warning') currentAnimState = 'alert';
  else if (isHovered) currentAnimState = 'hover';

  // Dynamic colors based on tab
  const upperBodyColor = activeTab === 'fridge' ? 'from-blue-50 to-blue-100' : 'from-blue-100 to-blue-200';
  const lowerBodyColor = activeTab === 'fridge' ? 'from-blue-100 to-blue-200' : 'from-blue-200 to-blue-300';
  const glowColor = activeTab === 'fridge' ? 'shadow-blue-200' : 'shadow-blue-300';

  return (
    <motion.div 
      className="fixed z-50"
      initial={{ top: '35%', left: '15%' }}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      whileDrag="drag"
    >
      <div className="relative flex flex-col items-center">
        {/* Mini Fridge Robot */}
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          onClick={handleInteraction}
          variants={robotVariants}
          animate={currentAnimState}
          className={`relative cursor-grab active:cursor-grabbing outline-none z-10 ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}
        >
        {/* Shadow under robot - hide when thinking/dragging */}
        <AnimatePresence>
          {status !== 'thinking' && !isDragging && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ scale: [1, 0.8, 1], opacity: [0.5, 0.2, 0.5] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/10 rounded-[100%] blur-sm pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Success Particles */}
        <AnimatePresence>
          {status === 'success' && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: 0, 
                    scale: Math.random() * 1.5 + 0.5,
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 100 - 20
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 text-yellow-400 z-0 pointer-events-none"
                >
                  <Sparkles size={12} />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Robot Body */}
        <div className="relative w-20 h-[100px] flex flex-col items-center z-10 drop-shadow-xl">
          {/* Top antenna */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <motion.div 
              animate={{ 
                backgroundColor: status === 'danger' ? '#ef4444' : status === 'warning' ? '#f59e0b' : status === 'success' ? '#22c55e' : '#60a5fa',
                scale: (isHovered || status === 'danger') ? [1, 1.5, 1] : 1
              }}
              transition={{ duration: (isHovered || status === 'danger') ? 0.5 : 0, repeat: status === 'danger' ? Infinity : 0 }}
              className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
            />
            <div className="w-0.5 h-2.5 bg-slate-300"></div>
          </div>

          {/* Fridge Chassis */}
          <div className="w-full h-full rounded-2xl border-[3px] border-slate-200 overflow-hidden shadow-inner flex flex-col relative bg-white">
            
            {/* Upper Section */}
            <div className={`h-[60%] w-full bg-gradient-to-br ${upperBodyColor} relative border-b-2 border-slate-200 p-1.5 flex flex-col items-center justify-center transition-colors duration-1000`}>
              {/* Fridge Handle */}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-slate-300 rounded-full shadow-sm"></div>
              
              {/* Screen / Face Area */}
              <div className="w-[85%] h-[80%] bg-slate-800 rounded-xl border-2 border-slate-700 shadow-inner overflow-hidden relative">
                {/* Screen glare */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 skew-y-12 origin-top-left pointer-events-none"></div>
                {/* Face Content */}
                {renderFace()}
              </div>
            </div>

            {/* Lower Section */}
            <div className={`h-[40%] w-full bg-gradient-to-br ${lowerBodyColor} relative p-2 flex items-center justify-center transition-colors duration-1000`}>
              {/* Freezer Handle */}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-slate-300 rounded-full shadow-sm"></div>
              
              {/* Vent details */}
              <div className="flex flex-col gap-1 w-2/3 mt-2">
                <div className="w-full h-0.5 bg-blue-300/50 rounded-full"></div>
                <div className="w-full h-0.5 bg-blue-300/50 rounded-full"></div>
                <div className="w-full h-0.5 bg-blue-300/50 rounded-full"></div>
              </div>
            </div>
            
            {/* Tab Context Particles */}
            <AnimatePresence>
              {activeTab === 'fridge' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none"
                >
                  <motion.div 
                    animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-2 left-2 text-blue-300/60"
                  >
                    <Droplets size={10} />
                  </motion.div>
                </motion.div>
              )}
              {activeTab === 'freezer' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none"
                >
                  <motion.div 
                    animate={{ y: [0, 10, 0], rotate: [0, 90, 180] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1 right-3 text-white/60"
                  >
                    <Snowflake size={12} />
                  </motion.div>
                  {/* Redesigned Ice Crystal / Frost Crown (Fits the robot's mechanical style better) */}
                  <motion.div 
                    initial={{ y: -10, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -10, opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-end justify-center gap-0.5"
                  >
                    {/* Left small crystal */}
                    <div className="w-1.5 h-3 bg-blue-200 rounded-t-sm opacity-80 transform -rotate-12 origin-bottom"></div>
                    {/* Center main crystal */}
                    <div className="w-2.5 h-5 bg-white rounded-t-sm shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"></div>
                    {/* Right small crystal */}
                    <div className="w-1.5 h-3 bg-blue-200 rounded-t-sm opacity-80 transform rotate-12 origin-bottom"></div>
                    
                    {/* Frost base across the top */}
                    <div className="absolute -bottom-1 w-14 h-1.5 bg-white/60 rounded-full blur-[1px]"></div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Shine effect on chassis */}
            <div className="absolute top-0 left-0 w-3 h-full bg-gradient-to-r from-white/60 to-transparent pointer-events-none"></div>
          </div>

          {/* Mechanical Arms */}
          <motion.div 
            variants={armLeftVariants}
            animate={currentAnimState}
            className="absolute top-[35%] -left-3 w-4 h-1.5 bg-slate-300 rounded-l-full shadow-sm origin-right z-0"
          >
            <div className="absolute -left-1.5 -top-1 w-2.5 h-3.5 border-2 border-slate-400 rounded-full border-r-transparent"></div>
          </motion.div>
          <motion.div 
            variants={armRightVariants}
            animate={currentAnimState}
            className="absolute top-[35%] -right-3 w-4 h-1.5 bg-slate-300 rounded-r-full shadow-sm origin-left z-0"
          >
            <div className="absolute -right-1.5 -top-1 w-2.5 h-3.5 border-2 border-slate-400 rounded-full border-l-transparent"></div>
          </motion.div>

          {/* Bottom Wheels / Thrusters */}
          <div className="absolute -bottom-2 flex gap-4">
            <div className="w-3.5 h-2.5 bg-slate-400 rounded-b-lg shadow-sm flex items-center justify-center overflow-hidden">
              <motion.div 
                animate={{ opacity: status === 'thinking' ? 0.2 : 0.7 }}
                className="w-2 h-2 bg-cyan-300 rounded-full blur-[2px] animate-pulse"
              />
            </div>
            <div className="w-3.5 h-2.5 bg-slate-400 rounded-b-lg shadow-sm flex items-center justify-center overflow-hidden">
              <motion.div 
                animate={{ opacity: status === 'thinking' ? 0.2 : 0.7 }}
                className="w-2 h-2 bg-cyan-300 rounded-full blur-[2px] animate-pulse"
              />
            </div>
          </div>
        </div>
        
        {/* Notification Badge - Pops up */}
        <AnimatePresence>
          {status !== 'normal' && status !== 'thinking' && status !== 'success' && !isOpen && (
            <motion.div 
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`absolute -top-2 -right-2 w-5 h-5 ${status === 'danger' ? 'bg-red-500' : 'bg-amber-500'} border-2 border-white rounded-full flex items-center justify-center z-20 shadow-md animate-bounce`}
            >
              <span className="text-[10px] font-black text-white">!</span>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute top-[120px] pointer-events-auto z-20 w-[240px]"
            >
              <div className="bg-white rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border-2 border-slate-100 relative backdrop-blur-sm bg-white/95">
                {/* Tail of the speech bubble (Now pointing UP and centered) */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-t-2 border-l-2 border-slate-100 transform rotate-45"></div>
                
                {status !== 'thinking' && (
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 transition-colors bg-slate-50 rounded-full p-1"
                  >
                    <X size={12} />
                  </button>
                )}
                
                <div className="flex items-start gap-2.5 mt-1">
                  <div className={`mt-0.5 p-1.5 rounded-full ${status === 'danger' ? 'bg-red-50' : status === 'warning' ? 'bg-amber-50' : status === 'success' ? 'bg-green-50' : 'bg-blue-50'} ${iconColor} flex-shrink-0`}>
                    {status === 'normal' ? <Info size={16} /> : 
                     status === 'success' ? <Sparkles size={16} /> :
                     status === 'thinking' ? <Loader2 size={16} className="animate-spin" /> :
                     <AlertTriangle size={16} />}
                  </div>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed pr-2">
                    {message}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

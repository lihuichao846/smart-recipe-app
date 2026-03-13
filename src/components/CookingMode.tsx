'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Clock, CheckCircle, Flame, ChefHat, Utensils, Smile, Soup, Cloud, Citrus, Sparkles } from 'lucide-react';
import { Recipe } from './RecipeCard';
import { db } from '@/lib/db';

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
}

export default function CookingMode({ recipe, onClose }: CookingModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract time from step instructions
  const extractTime = (instruction: string): number | null => {
    const hourMatch = instruction.match(/(\d+)\s*(hour|hr|小时)/i);
    if (hourMatch) return parseInt(hourMatch[1]) * 3600;
    
    const minMatch = instruction.match(/(\d+)\s*(minute|min|分钟)/i);
    if (minMatch) return parseInt(minMatch[1]) * 60;
    
    const secMatch = instruction.match(/(\d+)\s*(second|sec|秒)/i);
    if (secMatch) return parseInt(secMatch[1]);
    
    return null;
  };

  useEffect(() => {
    const time = extractTime(recipe.instructions[currentStep]);
    if (time) {
      setTimer(time);
      setIsTimerRunning(false);
    } else {
      setTimer(null);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStep, recipe.instructions]);

  useEffect(() => {
    if (isTimerRunning && timer !== null && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev !== null && prev > 0) return prev - 1;
          setIsTimerRunning(false);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    // Reset timer state when changing steps
    setIsTimerRunning(false);
    if (currentStep < recipe.instructions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    // Reset timer state when changing steps
    setIsTimerRunning(false);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    try {
      const calories = parseInt(recipe.calories.replace(/\D/g, '')) || 0;
      await db.calorieLogs.add({
        date: new Date(),
        recipeName: recipe.name,
        calories: calories,
        mealType: getMealType()
      });
      setShowCompletion(true);
    } catch (error) {
      console.error('Failed to save calorie log:', error);
      setShowCompletion(true);
    }
  };

  const getMealType = () => {
    const hour = new Date().getHours();
    if (hour < 10) return 'breakfast';
    if (hour < 15) return 'lunch';
    return 'dinner';
  };

  if (showCompletion) {
    return (
      <div className="fixed inset-0 z-50 bg-orange-50 flex flex-col items-center justify-center p-6 animate-fade-in overflow-hidden">
        {/* Confetti Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute animate-float-slow opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            >
              {i % 3 === 0 ? <Utensils className="text-orange-300" size={32} /> : 
               i % 3 === 1 ? <ChefHat className="text-yellow-300" size={24} /> : 
               <Smile className="text-red-300" size={28} />}
            </div>
          ))}
        </div>

        <div className="relative z-10 bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border-4 border-orange-100 transform transition-all animate-bounce-slow">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 shadow-inner">
            <CheckCircle size={64} />
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">大功告成！</h2>
          <p className="text-gray-500 mb-8">今天的你也是特级厨师呢~</p>
          
          <div className="bg-orange-50 rounded-2xl p-6 mb-8 border border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-bold">摄入热量</span>
              <span className="text-orange-500 font-black flex items-center gap-1 text-xl">
                <Flame size={24} className="fill-orange-500 animate-pulse" />
                +{recipe.calories}
              </span>
            </div>
            <p className="text-xs text-orange-300 font-medium">已自动记录到健康档案</p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-orange-400 to-red-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FFF8F0] flex flex-col">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#FFA500 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Dynamic Background Elements */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-500 ${isTimerRunning ? 'opacity-0' : 'opacity-100'}`}>
        {/* Floating Pot - Left Top */}
        <div className="absolute top-[15%] left-[10%] text-orange-200 opacity-40">
          <Soup size={80} strokeWidth={1.5} />
        </div>

        {/* Cooking Utensils - Right Bottom */}
        <div className="absolute bottom-[20%] right-[5%] text-orange-200 opacity-40">
           <Utensils size={100} strokeWidth={1.5} />
        </div>

        {/* Floating Chef Hat - Left Bottom */}
        <div className="absolute bottom-[15%] left-[8%] text-yellow-100 scale-100">
          <ChefHat size={120} strokeWidth={1} />
        </div>

        {/* Seasoning/Sparkles - Top Right */}
        <div className="absolute top-[20%] right-[15%] text-yellow-200 opacity-0">
          <Sparkles size={60} className="animate-pulse" />
          <div className="absolute top-10 right-10">
            <Citrus size={40} className="text-orange-200 animate-spin-slow opacity-60" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 border-b border-orange-100">
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <X size={20} />
        </button>
        <div className="text-center">
          <h3 className="font-bold text-gray-800 text-lg truncate max-w-[200px]">{recipe.name}</h3>
          <div className="flex justify-center gap-1 mt-1">
            {recipe.instructions.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-6 bg-[var(--primary)]' : 
                  idx < currentStep ? 'w-3 bg-orange-200' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center relative z-0">
        <div className="w-full max-w-md perspective-1000">
          {/* Step Card */}
          <div 
            key={currentStep} // Force re-render for animation
            className="bg-white rounded-[2rem] p-8 shadow-xl shadow-orange-100/50 border border-white relative overflow-hidden animate-fade-in-up"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-50 rounded-full opacity-50 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-50 rounded-full opacity-50 blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              {/* Text Content - Hidden when timer running */}
              <div className={`transition-all duration-500 w-full ${isTimerRunning ? 'opacity-0 h-0 overflow-hidden scale-95' : 'opacity-100 h-auto scale-100'}`}>
                <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-black mb-6">
                  STEP {currentStep + 1}
                </span>
                
                <p className="text-2xl font-bold text-gray-800 leading-relaxed mb-8 min-h-[120px]">
                  {recipe.instructions[currentStep]}
                </p>
              </div>

              {/* Central Animation - Visible when timer running */}
               <div className={`transition-all duration-700 ease-in-out flex flex-col items-center justify-end ${isTimerRunning ? 'opacity-100 h-80 mb-12 scale-110' : 'opacity-0 h-0 overflow-hidden scale-75'}`}>
                  <div className="relative flex flex-col items-center justify-end h-full w-full">
                     {/* Steam */}
                     <div className="absolute -top-20 flex gap-6 opacity-90 z-20">
                       <Cloud size={32} className="text-gray-100 fill-white animate-steam" style={{ animationDelay: '0s' }} />
                       <Cloud size={40} className="text-gray-100 fill-white animate-steam -mt-8" style={{ animationDelay: '0.5s' }} />
                       <Cloud size={32} className="text-gray-100 fill-white animate-steam" style={{ animationDelay: '1s' }} />
                     </div>
                     
                     {/* Pot */}
                     <div className="relative z-10 animate-bounce-slow">
                        <Soup size={180} className="text-orange-500 fill-orange-100 drop-shadow-xl" strokeWidth={1.5} />
                        {/* Bubbles */}
                        <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-orange-200 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                        <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-orange-300 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }}></div>
                     </div>
                     
                     {/* Flames */}
                     <div className="flex gap-2 -mt-4 relative z-0 items-end justify-center w-full">
                        <Flame size={48} className="text-orange-500 fill-orange-500 animate-flicker" style={{ animationDelay: '0s' }} />
                        <Flame size={64} className="text-red-500 fill-red-500 animate-flicker" style={{ animationDelay: '0.1s' }} />
                        <Flame size={72} className="text-yellow-500 fill-yellow-500 animate-flicker -mt-2" style={{ animationDelay: '0.2s' }} />
                        <Flame size={64} className="text-red-500 fill-red-500 animate-flicker" style={{ animationDelay: '0.15s' }} />
                        <Flame size={48} className="text-orange-500 fill-orange-500 animate-flicker" style={{ animationDelay: '0.05s' }} />
                     </div>
                     
                     {/* Stove base reflection */}
                     <div className="w-48 h-4 bg-black/10 rounded-[100%] blur-md mt-2"></div>
                  </div>
               </div>

              {/* Timer */}
              {timer !== null && (
                <div className={`rounded-2xl p-6 border transition-all duration-500 w-full ${
                  isTimerRunning 
                    ? 'bg-orange-50 border-orange-200 shadow-lg scale-105' 
                    : 'bg-blue-50 border-blue-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${isTimerRunning ? 'bg-orange-100 text-orange-500 animate-spin-slow' : 'bg-blue-100 text-blue-500'}`}>
                        <Clock size={24} />
                      </div>
                      <span className={`text-4xl font-mono font-black ${isTimerRunning ? 'text-orange-500' : 'text-blue-500'}`}>
                        {formatTime(timer)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`w-full mt-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                      isTimerRunning 
                        ? 'bg-white text-orange-500 border border-orange-200 hover:bg-orange-50' 
                        : 'bg-blue-500 text-white shadow-lg shadow-blue-200 hover:bg-blue-600'
                    }`}
                  >
                    {isTimerRunning ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                        计时中... (点击暂停)
                      </>
                    ) : (
                      '开始计时'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white/90 backdrop-blur p-6 border-t border-orange-100 pb-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-md mx-auto flex gap-4">
          <button 
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={20} /> 上一步
          </button>
          
          <button 
            onClick={handleNext}
            className="flex-[2] py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition-all hover:shadow-orange-300"
          >
            {currentStep === recipe.instructions.length - 1 ? (
              <>完成烹饪 <CheckCircle size={20} /></>
            ) : (
              <>下一步 <ChevronRight size={20} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

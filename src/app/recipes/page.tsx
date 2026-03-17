'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import CameraCapture from '@/components/CameraCapture';
import RecipeCard, { Recipe } from '@/components/RecipeCard';
import { ChefHat, RefreshCw, Sparkles, Utensils, ArrowLeft, Refrigerator, Camera, MessageCircle, Bot } from 'lucide-react';
import FloatingFood from '@/components/FloatingFood';
import { identifyIngredients, generateRecipes } from '@/lib/client-ai';
import CookingAnimation from '@/components/CookingAnimation';

export default function Home() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [preferences, setPreferences] = useState<string>('');
  
  // Camera Modal State
  const [showCamera, setShowCamera] = useState(false);

  // Fetch fridge ingredients
  const fridgeIngredients = useLiveQuery(() => db.ingredients.toArray());

  // Cold Air Particles State
  const [coldAirParticles, setColdAirParticles] = useState<Array<{left: string, top: string, delay: string, duration: string}>>([]);

  // Initialize particles on client side to avoid hydration mismatch
  React.useEffect(() => {
    setColdAirParticles([...Array(5)].map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${3 + Math.random() * 2}s`
    })));
  }, []);

  const handleCapture = async (imageData: string) => {
    setImageData(imageData);
    setShowCamera(false);
    setShowResults(true);
    setLoading(true);
    setError('');
    setIngredients([]);
    setRecipes([]);
    setCurrentModel('');

    try {
      // 1. Identify ingredients from image (Client-side)
      const identifiedItems = await identifyIngredients(imageData);
      const ingredientNames = identifiedItems.map(item => item.name);
      
      setIngredients(ingredientNames);

      if (ingredientNames.length === 0) {
        throw new Error('未能识别到任何食材，请尝试重新拍摄。');
      }

      // 2. Generate recipes based on ingredients (Client-side)
      const { recipes: generatedRecipes, model } = await generateRecipes(ingredientNames, preferences);

      setRecipes(generatedRecipes);
      if (model) {
        setCurrentModel(model);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '无法分析图片，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromFridge = async () => {
    if (!fridgeIngredients || fridgeIngredients.length === 0) {
      setError('冰箱空空如也，请先在冰箱管理页面添加食材！');
      return;
    }

    setImageData(null);
    setShowResults(true);
    setLoading(true);
    setError('');
    setIngredients([]);
    setRecipes([]);
    setCurrentModel('');

    try {
      const ingredientNames = fridgeIngredients.map(i => i.name);
      // Optimistically set ingredients for display
      setIngredients(ingredientNames);

      // Generate recipes based on ingredients (Client-side)
      const { recipes: generatedRecipes, model } = await generateRecipes(ingredientNames, preferences);

      setRecipes(generatedRecipes);
      if (model) {
        setCurrentModel(model);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '无法生成食谱，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImageData(null);
    setShowResults(false);
    setIngredients([]);
    setRecipes([]);
    setError('');
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#fffbf0]">
      {/* Background Decorative Elements */}
      <FloatingFood />
      
      {/* Soft Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-blue-50/30 pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 h-screen flex flex-col py-6">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/" className="p-3 bg-white/80 backdrop-blur rounded-2xl shadow-sm text-gray-500 hover:text-[var(--primary)] hover:shadow-md transition-all border border-white/60">
            <ArrowLeft size={24} />
          </Link>
          <div className="flex items-center gap-3 bg-white/60 backdrop-blur px-6 py-2 rounded-full border border-white/40 shadow-sm">
             <ChefHat className="text-[var(--primary)]" size={24} />
             <h1 className="text-xl font-black text-gray-700 tracking-tight">
               智能厨房 <span className="text-[var(--primary)]">AI 中控台</span>
             </h1>
          </div>
          <div className="w-12"></div> 
        </header>

        {error && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-lg animate-fade-in max-w-lg w-full">
            <div className="flex items-center gap-3">
              <div className="text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
              <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
                 <span className="sr-only">Close</span>
                 ×
              </button>
            </div>
          </div>
        )}

        {/* Control Center Layout */}
        {!showResults ? (
          <div className="flex-1 flex flex-col relative">
             {/* Center Visual Core - The AI Hub */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <div className="relative w-64 h-64 flex items-center justify-center">
                   {/* Glowing Pulse Rings */}
                   <div className="absolute inset-0 bg-[var(--primary)]/5 rounded-full animate-signal-ripple" />
                   <div className="absolute inset-4 bg-[var(--primary)]/10 rounded-full animate-signal-ripple" style={{ animationDelay: '0.5s' }} />
                   
                   {/* Core Sphere */}
                   <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-white rounded-full shadow-[0_0_40px_rgba(255,159,135,0.3)] border-4 border-white flex items-center justify-center relative z-10 animate-breathe">
                      <Bot size={48} className="text-[var(--primary)] drop-shadow-sm" />
                      <div className="absolute -bottom-8 text-xs font-black text-[var(--primary)] uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm">
                        AI Core
                      </div>
                   </div>

                   {/* Connecting Lines */}
                   <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent -z-10" />
                   <div className="absolute top-0 left-1/2 w-[2px] h-full bg-gradient-to-b from-transparent via-[var(--primary)]/20 to-transparent -z-10" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6 flex-1 h-full pb-32">
                {/* Left Panel: Camera Identification */}
                <div 
                  onClick={() => setShowCamera(true)}
                  className="relative group bg-white/40 backdrop-blur-sm border-2 border-dashed border-gray-300 rounded-[2rem] p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-white/60 hover:border-[var(--primary)] hover:shadow-xl transition-all duration-500 overflow-hidden"
                >
                   {/* Scanning Overlay Effect */}
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--primary)]/5 to-transparent h-[20%] w-full animate-scan-line pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                   
                   {/* Camera Viewfinder Corners */}
                   <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-gray-300 rounded-tl-xl group-hover:border-[var(--primary)] transition-colors" />
                   <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-gray-300 rounded-tr-xl group-hover:border-[var(--primary)] transition-colors" />
                   <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-gray-300 rounded-bl-xl group-hover:border-[var(--primary)] transition-colors" />
                   <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-gray-300 rounded-br-xl group-hover:border-[var(--primary)] transition-colors" />

                   <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-orange-400 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                      <Camera size={48} />
                   </div>
                   <h2 className="text-2xl font-black text-gray-700 mb-2 group-hover:text-[var(--primary)] transition-colors">拍照识别</h2>
                   <p className="text-gray-400 text-center max-w-xs text-sm">
                      启动 AI 视觉引擎，扫描食材生成食谱
                   </p>
                </div>

                {/* Right Panel: Fridge Inventory */}
                <div 
                  onClick={handleGenerateFromFridge}
                  className="relative group bg-blue-50/30 backdrop-blur-sm border-2 border-blue-100 rounded-[2rem] p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/60 hover:border-blue-300 hover:shadow-xl transition-all duration-500 overflow-hidden"
                >
                   {/* Cold Air Particles */}
                   <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {coldAirParticles.map((p, i) => (
                        <div 
                          key={i}
                          className="absolute w-2 h-2 bg-blue-200 rounded-full blur-[1px] animate-cold-air"
                          style={{
                            left: p.left,
                            top: p.top,
                            animationDelay: p.delay,
                            animationDuration: p.duration
                          }}
                        />
                      ))}
                   </div>

                   {/* Fridge Outline Decor */}
                   <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-32 bg-blue-100/50 rounded-l-lg" />
                   
                   <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform duration-300 shadow-inner border border-blue-200">
                      <Refrigerator size={48} />
                   </div>
                   <h2 className="text-2xl font-black text-gray-700 mb-2 group-hover:text-blue-500 transition-colors">冰箱直连</h2>
                   <p className="text-gray-400 text-center max-w-xs text-sm">
                      连接库存数据库，一键智能生成
                   </p>
                   {fridgeIngredients && fridgeIngredients.length > 0 && (
                      <span className="mt-4 px-3 py-1 bg-blue-200/50 text-blue-600 text-xs font-bold rounded-full">
                        {fridgeIngredients.length} 种食材待命
                      </span>
                   )}
                </div>
             </div>

             {/* Bottom Panel: AI Chat Preferences */}
             <div className="absolute bottom-0 left-0 right-0 h-32 bg-white/60 backdrop-blur-md border-t border-white/80 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] p-6 flex items-center gap-6 animate-slide-up">
                <div className="w-16 h-16 bg-[var(--accent)]/20 rounded-2xl flex-shrink-0 flex items-center justify-center text-[var(--accent-text)] animate-pulse-border">
                   <MessageCircle size={32} />
                </div>
                <div className="flex-1 relative">
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block pl-1">
                      AI 饮食偏好对话
                   </label>
                   <input
                      value={preferences}
                      onChange={(e) => setPreferences(e.target.value)}
                      placeholder="告诉 AI：想吃辣一点？还是清淡的减脂餐？..."
                      className="w-full bg-transparent border-b-2 border-gray-200 focus:border-[var(--primary)] py-2 text-lg text-gray-700 placeholder:text-gray-300 outline-none transition-colors font-medium"
                   />
                   <div className="absolute right-0 bottom-3 animate-pulse text-[var(--primary)] opacity-50">
                      <span className="inline-block w-2 h-2 bg-current rounded-full mx-0.5"></span>
                      <span className="inline-block w-2 h-2 bg-current rounded-full mx-0.5 animation-delay-200"></span>
                      <span className="inline-block w-2 h-2 bg-current rounded-full mx-0.5 animation-delay-400"></span>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
             {/* Result View */}
             <div className="glass-card p-8 rounded-[2.5rem] border border-white/60 min-h-full">
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                    <Sparkles className="text-[var(--accent)]" />
                    AI 料理方案
                  </h2>
                  <button 
                    onClick={handleReset}
                    className="btn-cute bg-gray-100 text-gray-500 hover:bg-gray-200 py-2 px-4 text-sm"
                  >
                    <RefreshCw size={16} /> 重置
                  </button>
               </div>

               {/* Ingredients Display */}
               {imageData && !loading && (
                 <div className="relative w-full h-48 rounded-3xl overflow-hidden mb-8 shadow-md group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageData} alt="Analysis" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                       <div className="text-white">
                          <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">识别源</p>
                          <div className="flex flex-wrap gap-2">
                             {ingredients.map((ing, i) => (
                               <span key={i} className="px-2 py-1 bg-white/20 backdrop-blur rounded-lg text-sm font-bold border border-white/30">
                                 {ing}
                               </span>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}
               
               {/* Loading Animation */}
               {loading ? (
                 <div className="flex flex-col items-center justify-center py-20">
                   <CookingAnimation />
                 </div>
               ) : (
                 <div className="animate-fade-in">
                    {/* Model Badge */}
                    {currentModel && (
                      <div className="flex justify-center mb-8">
                        <span className="px-4 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border border-blue-100 uppercase tracking-wide shadow-sm flex items-center gap-2">
                           <Bot size={14} />
                           Generated by {currentModel}
                        </span>
                      </div>
                    )}
                    
                    {/* Recipes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recipes.map((recipe, idx) => (
                        <div key={idx} style={{ animationDelay: `${idx * 150}ms` }} className="animate-fade-in">
                           <RecipeCard recipe={recipe} />
                        </div>
                      ))}
                    </div>
                 </div>
               )}
             </div>
          </div>
        )}

        {/* Camera Modal Overlay - Themed */}
        {showCamera && (
          <div className="fixed inset-0 z-50 bg-[#fffbf0]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
             {/* Decorative Background Elements */}
             <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_80%)]" />
                <div className="absolute top-10 left-10 w-40 h-40 bg-orange-100/50 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-100/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
             </div>

             <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/60 ring-4 ring-white/40">
                {/* Header Bar */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/90 to-transparent z-10 flex items-center px-6">
                    <button 
                      onClick={() => setShowCamera(false)}
                      className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-[var(--primary)] hover:bg-orange-50 transition-all active:scale-95 group border border-gray-100 flex items-center gap-2 pr-4"
                    >
                      <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                      <span className="text-xs font-bold">返回</span>
                    </button>
                </div>

                <div className="pt-20 pb-8 px-4 bg-gradient-to-b from-orange-50/20 to-blue-50/20 min-h-[400px] flex items-center justify-center">
                    <CameraCapture onCapture={handleCapture} />
                </div>
             </div>
             
             <p className="relative z-10 text-gray-400 mt-6 text-sm font-bold bg-white/60 px-6 py-2 rounded-full backdrop-blur-md shadow-sm border border-white/50 flex items-center gap-2">
                <Camera size={16} className="text-[var(--primary)]" />
                请将食材置于取景框中心
             </p>
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import CameraCapture from '@/components/CameraCapture';
import RecipeCard, { Recipe } from '@/components/RecipeCard';
import { ChefHat, RefreshCw, Sparkles, Utensils, ArrowLeft, Refrigerator } from 'lucide-react';
import FloatingFood from '@/components/FloatingFood';

export default function Home() {
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [preferences, setPreferences] = useState<string>('');

  // Fetch fridge ingredients
  const fridgeIngredients = useLiveQuery(() => db.ingredients.toArray());

  const handleCapture = async (imageData: string) => {
    setImageData(imageData);
    setShowResults(true);
    setLoading(true);
    setError('');
    setIngredients([]);
    setRecipes([]);
    setCurrentModel('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData, preferences }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze image');
      }

      setIngredients(data.ingredients);
      setRecipes(data.recipes);
      if (data.model) {
        setCurrentModel(data.model);
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

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredientNames, preferences }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recipes');
      }

      if (data.ingredients && data.ingredients.length > 0) {
          setIngredients(data.ingredients);
      }
      setRecipes(data.recipes);
      if (data.model) {
        setCurrentModel(data.model);
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
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gray-50">
      {/* Background Decorative Elements */}
      <FloatingFood />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Section */}
        <header className="mb-12 relative">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="p-3 bg-white rounded-2xl shadow-sm text-gray-500 hover:text-[var(--primary)] hover:shadow-md transition-all">
              <ArrowLeft size={24} />
            </Link>
            <div className="w-12"></div> {/* Spacer for balance */}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm mb-6 border border-orange-50 rotate-3">
              <ChefHat className="text-[var(--primary)]" size={48} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-800 tracking-tight mb-4">
              智能冰箱<span className="text-[var(--primary)]">食谱推荐</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              不知道吃什么？拍一张冰箱食材的照片，或直接使用库存信息，AI 为你定制<span className="text-[var(--accent-hover)] font-medium">健康美味</span>的专属食谱。
            </p>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-xl shadow-sm animate-fade-in mx-auto max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {!showResults ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            {/* Preferences Input */}
            <div className="glass-card p-6 rounded-3xl border border-white/60 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-[var(--accent)]">✨</span> 
                饮食偏好（可选）
              </h3>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="例如：我想要减脂餐、不吃辣、想做快手早餐、最近喉咙痛想吃清淡点..."
                className="w-full p-4 bg-white/50 rounded-2xl border-2 border-transparent focus:border-[var(--primary)] focus:bg-white transition-all outline-none resize-none min-h-[100px] text-gray-700 placeholder:text-gray-400"
              />
            </div>

            {/* Camera Option */}
            <div className="glass-card p-8 md:p-12 rounded-3xl text-center transition-all duration-500 hover:shadow-xl border border-white/60">
              <div className="mb-8">
                <div className="w-16 h-16 bg-[var(--secondary)] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[var(--primary)]">
                  <Utensils size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">拍照识别</h2>
                <p className="text-gray-500">点击下方按钮拍摄或上传冰箱食材照片</p>
              </div>
              <div className="max-w-md mx-auto bg-white p-2 rounded-2xl shadow-inner border border-gray-100">
                 <CameraCapture onCapture={handleCapture} />
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 font-medium text-sm">或者</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Inventory Option */}
            <div className="glass-card p-8 rounded-3xl text-center transition-all duration-500 hover:shadow-xl border border-white/60 flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-500">
                <Refrigerator size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">使用现有库存</h2>
              <p className="text-gray-500 mb-6">根据你在“冰箱管理”中记录的食材直接生成食谱</p>
              <button 
                onClick={handleGenerateFromFridge}
                className="btn-cute bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-200 px-8 py-3 text-lg flex items-center gap-2"
              >
                <Sparkles size={20} />
                生成今日食谱
              </button>
              {fridgeIngredients && fridgeIngredients.length > 0 && (
                <p className="mt-4 text-sm text-gray-400">
                  当前库存: {fridgeIngredients.length} 种食材
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in">
            {/* Analysis Section */}
            <div className="glass-card p-8 rounded-3xl border border-white/60 flex flex-col items-center max-w-4xl mx-auto">
               {imageData ? (
                 <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden mb-8 shadow-lg border-4 border-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageData} alt="Captured Fridge" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl pointer-events-none"></div>
                 </div>
               ) : (
                 <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden mb-8 shadow-lg border-4 border-white bg-blue-50 flex flex-col items-center justify-center text-blue-300">
                    <Refrigerator size={64} className="mb-4" />
                    <p className="font-bold text-lg text-blue-400">基于冰箱库存分析</p>
                 </div>
               )}
               
               {loading ? (
                 <div className="flex flex-col items-center justify-center py-8 w-full max-w-md bg-white/50 rounded-2xl backdrop-blur-sm">
                   <div className="relative mb-6">
                     <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-100 border-t-[var(--primary)]"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={20} className="text-[var(--accent)] animate-pulse" />
                     </div>
                   </div>
                   <p className="text-gray-700 font-bold text-lg mb-1">正在构思美味食谱...</p>
                   <p className="text-gray-400 text-sm">AI 大厨正在思考中</p>
                 </div>
               ) : (
                 <div className="w-full">
                    {currentModel && (
                     <div className="mb-6 text-center">
                       <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100 tracking-wide uppercase">
                         <Sparkles size={12} />
                         AI Model: {currentModel}
                       </span>
                     </div>
                   )}
                    
                    {ingredients.length > 0 && (
                      <div className="mb-10 text-center">
                        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center justify-center gap-2">
                          <span className="w-8 h-[1px] bg-gray-300"></span>
                          {imageData ? '识别到的食材' : '使用库存食材'}
                          <span className="w-8 h-[1px] bg-gray-300"></span>
                        </h3>
                        <div className="flex flex-wrap justify-center gap-3">
                          {ingredients.map((ing, idx) => (
                            <span key={idx} className="px-4 py-2 bg-white border border-[var(--primary-light)] text-[var(--foreground)] rounded-xl text-sm font-medium shadow-sm">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-center">
                      <button 
                        onClick={handleReset}
                        className="btn-cute bg-white text-gray-500 border-2 border-gray-100 hover:border-[var(--primary)] hover:text-[var(--primary)] group"
                      >
                        <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                        {imageData ? '重新拍摄' : '重新生成'}
                      </button>
                    </div>
                 </div>
               )}
            </div>

            {/* Recipes Grid */}
            {!loading && recipes.length > 0 && (
              <div className="animate-fade-in">
                 <h2 className="text-3xl font-bold text-center text-gray-800 mb-8 flex items-center justify-center gap-3">
                    <span className="text-[var(--accent)]">✦</span> 推荐食谱 <span className="text-[var(--accent)]">✦</span>
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {recipes.map((recipe, idx) => (
                    <div key={idx} style={{ animationDelay: `${idx * 150}ms` }} className="animate-fade-in">
                       <RecipeCard recipe={recipe} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

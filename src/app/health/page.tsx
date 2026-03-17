'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CalorieLog } from '@/lib/db';
import { getMealTypeByTime } from '@/lib/utils';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Flame, 
  Utensils, 
  Coffee, 
  Sun, 
  Moon, 
  Apple,
  Dumbbell,
  HeartPulse,
  Droplets,
  Carrot
} from 'lucide-react';

export default function HealthPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState<{
    name: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    mealType: string;
  }>({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'breakfast'
  });

  const dailyLogs = useLiveQuery(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await db.calorieLogs
      .where('date')
      .aboveOrEqual(today)
      .toArray();
  }, []);

  const totals = dailyLogs?.reduce((acc, log) => ({
    calories: acc.calories + (log.calories || 0),
    protein: acc.protein + (log.protein || 0),
    carbs: acc.carbs + (log.carbs || 0),
    fat: acc.fat + (log.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const userSettings = useLiveQuery(() => db.settings.get('daily_calorie_goal'));
  const goal = userSettings?.value || 2000;
  
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');

  const openGoalEditor = () => {
    setTempGoal(goal.toString());
    setIsEditingGoal(true);
  };

  const saveGoal = async () => {
    const val = parseInt(tempGoal);
    if (!isNaN(val) && val > 0) {
      await db.settings.put({ id: 'daily_calorie_goal', value: val });
      setIsEditingGoal(false);
    }
  };

  const percentage = Math.min((totals.calories / goal) * 100, 100);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReason, setAnalysisReason] = useState('');

  const openAddForm = () => {
    // We don't need to pre-set mealType anymore as it will be determined on submit time
    // But for UI state consistency we can set a default
    setNewEntry(prev => ({ ...prev }));
    setShowAddForm(true);
    setAnalysisReason('');
  };

  const handleAnalyzeFood = async () => {
    if (!newEntry.name) return;
    setIsAnalyzing(true);
    setAnalysisReason('');

    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName: newEntry.name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setNewEntry(prev => ({
        ...prev,
        calories: data.calories?.toString() || '',
        protein: data.protein?.toString() || '',
        carbs: data.carbs?.toString() || '',
        fat: data.fat?.toString() || '',
      }));
      if (data.reasoning) {
        setAnalysisReason(data.reasoning);
      }
    } catch (error) {
      console.error('Failed to analyze:', error);
      alert(`AI 估算失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.name) return;

    let finalCalories = parseInt(newEntry.calories) || 0;
    let finalProtein = parseFloat(newEntry.protein) || 0;
    let finalCarbs = parseFloat(newEntry.carbs) || 0;
    let finalFat = parseFloat(newEntry.fat) || 0;
    let aiReasoning = analysisReason;

    // Auto-analyze if calories are missing
    if (finalCalories === 0) {
      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/analyze-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodName: newEntry.name }),
        });

        if (!response.ok) throw new Error('Analysis failed');

        const data = await response.json();
        finalCalories = data.calories || 0;
        finalProtein = data.protein || 0;
        finalCarbs = data.carbs || 0;
        finalFat = data.fat || 0;
        aiReasoning = data.reasoning || '';
      } catch (error) {
        console.error('Failed to auto-analyze:', error);
        alert('AI 自动估算失败，请手动输入热量');
        setIsAnalyzing(false);
        return;
      }
      setIsAnalyzing(false);
    }

    // Use current time to determine meal type dynamically
    const now = new Date();
    const dynamicMealType = getMealTypeByTime(now);

    await db.calorieLogs.add({
      date: now,
      recipeName: newEntry.name,
      calories: finalCalories,
      protein: finalProtein,
      carbs: finalCarbs,
      fat: finalFat,
      mealType: dynamicMealType, // Use the dynamically calculated type
    } as CalorieLog);

    setNewEntry({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      mealType: 'breakfast' // Reset to default
    });
    setAnalysisReason('');
    setShowAddForm(false);
  };

  const handleDelete = async (id: number) => {
    await db.calorieLogs.delete(id);
  };

  const mealTypes = [
    { id: 'breakfast', label: '早餐', icon: <Coffee size={18} />, color: 'text-orange-500', bg: 'bg-orange-100' },
    { id: 'lunch', label: '午餐', icon: <Sun size={18} />, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { id: 'dinner', label: '晚餐', icon: <Moon size={18} />, color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { id: 'snack', label: '加餐', icon: <Apple size={18} />, color: 'text-green-500', bg: 'bg-green-100' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 overflow-hidden relative">
      {/* Decorative Background Icons */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <Dumbbell className="absolute top-20 left-10 text-orange-500 animate-float-slow" size={48} />
        <HeartPulse className="absolute top-40 right-10 text-red-500 animate-float-delayed" size={56} />
        <Carrot className="absolute bottom-32 left-8 text-orange-600 animate-bounce-slow" size={40} />
        <Droplets className="absolute bottom-48 right-12 text-blue-400 animate-pulse-slow" size={36} />
        <Apple className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500" size={120} />
      </div>

      {/* Goal Edit Modal */}
      {isEditingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <h3 className="text-xl font-bold text-gray-800 mb-2">设定每日目标</h3>
            <p className="text-gray-500 text-sm mb-6">推荐成年人每日摄入 1800-2500 kcal</p>
            
            <div className="relative mb-6">
              <input
                type="number"
                value={tempGoal}
                onChange={(e) => setTempGoal(e.target.value)}
                className="w-full text-center text-4xl font-black text-orange-500 bg-orange-50 rounded-2xl py-4 focus:outline-none focus:ring-2 focus:ring-orange-200"
                autoFocus
              />
              <span className="absolute right-4 bottom-5 text-gray-400 font-bold">kcal</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditingGoal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveGoal}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 text-white font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 transform active:scale-95 transition-all"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">今日健康饮食</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Daily Summary Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Flame size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="text-center mb-6">
              <span className="text-gray-400 text-sm uppercase tracking-wider font-semibold">总热量摄入 / 目标 {goal}</span>
              <div 
                onClick={openGoalEditor}
                className="text-5xl font-black text-gray-800 mt-2 flex items-baseline justify-center gap-1 cursor-pointer hover:scale-105 transition-transform"
                title="点击修改每日目标"
              >
                {totals.calories}
                <span className="text-lg text-gray-400 font-medium">kcal</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full mt-4 overflow-hidden max-w-[200px] mx-auto">
                 <div 
                   className="h-full bg-gradient-to-r from-orange-300 to-red-500 rounded-full transition-all duration-1000 ease-out"
                   style={{ width: `${percentage}%` }}
                 />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-orange-50 rounded-2xl">
                <div className="text-xs text-gray-500 mb-1">蛋白质</div>
                <div className="font-bold text-orange-700">{totals.protein.toFixed(1)}g</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-2xl">
                <div className="text-xs text-gray-500 mb-1">碳水</div>
                <div className="font-bold text-yellow-700">{totals.carbs.toFixed(1)}g</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-2xl">
                <div className="text-xs text-gray-500 mb-1">脂肪</div>
                <div className="font-bold text-red-700">{totals.fat.toFixed(1)}g</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Add Button Area */}
        <button
          onClick={openAddForm}
          className="w-full py-4 bg-white border-2 border-dashed border-orange-200 text-orange-400 rounded-3xl flex items-center justify-center gap-2 font-bold hover:bg-orange-50 hover:border-orange-300 transition-colors"
        >
          <Plus size={20} />
          记一笔饮食
        </button>

        {/* Meal Lists */}
        <div className="space-y-4">
          {mealTypes.map((type) => {
            const meals = dailyLogs?.filter(log => log.mealType === type.id) || [];
            const mealCalories = meals.reduce((acc, log) => acc + log.calories, 0);

            return (
              <div key={type.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${type.bg} ${type.color} rounded-full flex items-center justify-center`}>
                      {type.icon}
                    </div>
                    <h3 className="font-bold text-gray-700">{type.label}</h3>
                  </div>
                  <span className="text-sm font-medium text-gray-400">{mealCalories} kcal</span>
                </div>

                {meals.length > 0 ? (
                  <div className="space-y-2">
                    {meals.map(meal => (
                      <div key={meal.id} className="flex items-center justify-between py-2 border-t border-gray-50">
                        <div>
                          <div className="font-medium text-gray-800">{meal.recipeName}</div>
                          <div className="text-xs text-gray-400">
                            {meal.protein ? `P:${meal.protein}g ` : ''}
                            {meal.carbs ? `C:${meal.carbs}g ` : ''}
                            {meal.fat ? `F:${meal.fat}g` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-600">{meal.calories}</span>
                          <button 
                            onClick={() => handleDelete(meal.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-300 text-sm italic">
                    暂无记录
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Add Button */}
      <button
        onClick={openAddForm}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[var(--primary)] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <Plus size={28} />
      </button>

      {/* Add Entry Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-800">记录饮食</h2>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                取消
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">食物名称</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newEntry.name}
                    onChange={e => setNewEntry({...newEntry, name: e.target.value})}
                    className="flex-1 p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-200"
                    placeholder="例如：燕麦牛奶 200ml"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyzeFood}
                    disabled={!newEntry.name || isAnalyzing}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap transition-colors"
                  >
                    {isAnalyzing ? (
                      <span className="animate-pulse">分析中...</span>
                    ) : (
                      <>
                        <Flame size={14} /> AI 估算
                      </>
                    )}
                  </button>
                </div>
                {analysisReason && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                    💡 AI: {analysisReason}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">热量 (kcal)</label>
                  <input
                    type="number"
                    value={newEntry.calories}
                    onChange={e => setNewEntry({...newEntry, calories: e.target.value})}
                    placeholder="不填则AI自动计算"
                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-200 placeholder:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">蛋白质 (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.protein}
                    onChange={e => setNewEntry({...newEntry, protein: e.target.value})}
                    className="w-full p-2 bg-gray-50 rounded-xl border-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">碳水 (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.carbs}
                    onChange={e => setNewEntry({...newEntry, carbs: e.target.value})}
                    className="w-full p-2 bg-gray-50 rounded-xl border-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">脂肪 (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newEntry.fat}
                    onChange={e => setNewEntry({...newEntry, fat: e.target.value})}
                    className="w-full p-2 bg-gray-50 rounded-xl border-none text-sm"
                  />
                </div>
              </div>

              <div className="text-xs text-center text-gray-400">
                {newEntry.calories ? '点击提交保存数据' : '提交后将自动按一人份估算热量'}
              </div>

              <button
                type="submit"
                disabled={!newEntry.name || isAnalyzing}
                className="w-full py-4 bg-[var(--primary)] text-white font-bold rounded-2xl hover:opacity-90 transition-opacity mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    正在智能分析...
                  </>
                ) : (
                  '确认记录'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

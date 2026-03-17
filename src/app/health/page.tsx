'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CalorieLog } from '@/lib/db';
import { getMealTypeByTime } from '@/lib/utils';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Flame, 
  Coffee, 
  Sun, 
  Moon, 
  Apple,
  Leaf,
  Droplets,
  Utensils,
  ChevronRight,
  Bot,
  Sparkles,
  Info,
  Settings
} from 'lucide-react';

// --- Components ---

const RingProgress = ({ 
  current, 
  total, 
  size = 180, 
  strokeWidth = 15,
  color = "#ff9f87" 
}: { 
  current: number; 
  total: number; 
  size?: number; 
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max(current / total, 0), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f3f0e6"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center animate-fade-in">
        <span className="text-4xl font-black text-gray-700 font-mono tracking-tighter">
          {Math.round(current)}
        </span>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">
          / {total} kcal
        </span>
      </div>
    </div>
  );
};

const NutrientCard = ({ 
  label, 
  current, 
  target, 
  unit, 
  color, 
  bg, 
  icon: Icon 
}: { 
  label: string; 
  current: number; 
  target: number; 
  unit: string; 
  color: string; 
  bg: string; 
  icon: any;
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  let status = '适中';
  if (percentage < 50) status = '不足';
  if (percentage > 110) status = '偏高';

  return (
    <div className={`relative overflow-hidden rounded-[24px] p-4 ${bg} transition-transform hover:scale-105 duration-300`}>
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-xl bg-white/60 backdrop-blur-sm ${color}`}>
          <Icon size={18} />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/40 ${color}`}>
          {status}
        </span>
      </div>
      <h4 className="text-gray-600 font-bold text-sm mb-1">{label}</h4>
      <div className="flex items-baseline gap-1 mb-3">
        <span className={`text-2xl font-black ${color}`}>{current.toFixed(1)}</span>
        <span className="text-xs text-gray-400 font-medium">/ {Math.round(target)}{unit}</span>
      </div>
      <div className="h-2 w-full bg-white/40 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${color.replace('text-', 'bg-')} transition-all duration-1000`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const MealCard = ({ 
  title, 
  calories, 
  items, 
  onAdd, 
  onDelete,
  icon: Icon,
  colorClass,
  bgClass
}: { 
  title: string; 
  calories: number; 
  items: CalorieLog[]; 
  onAdd: () => void; 
  onDelete: (id: number) => void;
  icon: any;
  colorClass: string;
  bgClass: string;
}) => {
  const macros = items.reduce((acc, item) => ({
    p: acc.p + (item.protein || 0),
    c: acc.c + (item.carbs || 0),
    f: acc.f + (item.fat || 0),
  }), { p: 0, c: 0, f: 0 });

  return (
    <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 relative overflow-hidden group">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${bgClass} ${colorClass} flex items-center justify-center shadow-sm`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{title}</h3>
            <div className="text-xs text-gray-400 font-medium flex gap-2">
              <span>P: {macros.p.toFixed(0)}g</span>
              <span>C: {macros.c.toFixed(0)}g</span>
              <span>F: {macros.f.toFixed(0)}g</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-lg font-black text-gray-700">{Math.round(calories)}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase">kcal</span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2 mb-3">
        {items.length > 0 ? (
          items.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-gray-50/80 rounded-xl p-3 hover:bg-gray-50 transition-colors group/item">
              <span className="text-sm font-bold text-gray-600">{item.recipeName}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-400">{item.calories} kcal</span>
                <button 
                  onClick={() => onDelete(item.id)}
                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-300 text-xs font-medium italic border-2 border-dashed border-gray-100 rounded-xl">
            还没有记录哦 ~
          </div>
        )}
      </div>

      {/* Add Button */}
      <button 
        onClick={onAdd}
        className={`w-full py-2 rounded-xl text-xs font-bold ${bgClass} ${colorClass} opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center gap-1`}
      >
        <Plus size={14} /> 记录{title}
      </button>
    </div>
  );
};

// Plan Types
type DietPlanType = 'normal' | 'fat_loss' | 'muscle_gain' | 'custom';

interface DietPlan {
  type: DietPlanType;
  calories: number;
  ratios: { p: number; c: number; f: number }; // Percentage (0-100)
}

const DEFAULT_PLANS: Record<string, DietPlan> = {
  normal: { type: 'normal', calories: 2000, ratios: { p: 20, c: 50, f: 30 } },
  fat_loss: { type: 'fat_loss', calories: 1600, ratios: { p: 40, c: 30, f: 30 } },
  muscle_gain: { type: 'muscle_gain', calories: 2400, ratios: { p: 30, c: 50, f: 20 } },
};

export default function HealthPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  
  // Data State
  const dailyLogs = useLiveQuery(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await db.calorieLogs
      .where('date')
      .aboveOrEqual(today)
      .toArray();
  }, []);

  const userPlan = useLiveQuery(() => db.settings.get('diet_plan'));
  
  const currentPlan: DietPlan = userPlan?.value || DEFAULT_PLANS.normal;
  
  // Local state for editing plan
  const [editingPlan, setEditingPlan] = useState<DietPlan>(currentPlan);

  useEffect(() => {
    if (userPlan?.value) {
      setEditingPlan(userPlan.value);
    }
  }, [userPlan]);

  // Calculated Totals
  const totals = dailyLogs?.reduce((acc, log) => ({
    calories: acc.calories + (log.calories || 0),
    protein: acc.protein + (log.protein || 0),
    carbs: acc.carbs + (log.carbs || 0),
    fat: acc.fat + (log.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Macro Goals based on Plan
  const calorieGoal = currentPlan.calories;
  const proteinGoal = (calorieGoal * (currentPlan.ratios.p / 100)) / 4;
  const carbsGoal = (calorieGoal * (currentPlan.ratios.c / 100)) / 4;
  const fatGoal = (calorieGoal * (currentPlan.ratios.f / 100)) / 9;

  // Form State
  const [newEntry, setNewEntry] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReason, setAnalysisReason] = useState('');

  // Handlers
  const handleDelete = async (id: number) => {
    await db.calorieLogs.delete(id);
  };

  const openAddForm = (mealType: string) => {
    setSelectedMealType(mealType);
    setNewEntry({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setAnalysisReason('');
    setShowAddForm(true);
  };

  const handleAnalyzeFood = async () => {
    if (!newEntry.name) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName: newEntry.name }),
      });
      const data = await response.json();
      setNewEntry(prev => ({
        ...prev,
        calories: data.calories?.toString() || '',
        protein: data.protein?.toString() || '',
        carbs: data.carbs?.toString() || '',
        fat: data.fat?.toString() || '',
      }));
      if (data.reasoning) setAnalysisReason(data.reasoning);
    } catch (error) {
      console.error(error);
      alert('AI 估算失败，请重试');
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

    // Auto-analyze if calories missing
    if (finalCalories === 0) {
      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/analyze-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodName: newEntry.name }),
        });
        const data = await response.json();
        finalCalories = data.calories || 0;
        finalProtein = data.protein || 0;
        finalCarbs = data.carbs || 0;
        finalFat = data.fat || 0;
      } catch (err) {
        setIsAnalyzing(false);
        return;
      }
      setIsAnalyzing(false);
    }

    await db.calorieLogs.add({
      date: new Date(),
      recipeName: newEntry.name,
      calories: finalCalories,
      protein: finalProtein,
      carbs: finalCarbs,
      fat: finalFat,
      mealType: selectedMealType,
    } as CalorieLog);

    setShowAddForm(false);
  };

  const savePlan = async () => {
    await db.settings.put({ id: 'diet_plan', value: editingPlan });
    // Also sync legacy goal for backward compatibility if needed, though we use plan now
    await db.settings.put({ id: 'daily_calorie_goal', value: editingPlan.calories });
    setShowGoalModal(false);
  };

  // AI Advice Logic
  const getAIAdvice = () => {
    if (totals.calories > calorieGoal) return "今天的热量有点超标啦，晚餐建议清淡一点哦！🏃‍♀️";
    if (totals.protein < proteinGoal * 0.6) return "蛋白质摄入不足哦，加个蛋或者喝杯牛奶吧！🥛";
    if (totals.fat > fatGoal) return "今天的油脂摄入偏高，注意控制哦~ 🥑";
    if (totals.calories < calorieGoal * 0.5 && new Date().getHours() > 18) return "还在饿肚子吗？记得按时吃饭哦！🍲";
    
    // Plan specific advice
    if (currentPlan.type === 'fat_loss') return "减脂期要注意优质蛋白摄入，加油！🔥";
    if (currentPlan.type === 'muscle_gain') return "增肌期碳水要跟上，训练后记得补充！💪";

    return "饮食很均衡，继续保持健康好状态！✨";
  };

  return (
    <div className="min-h-screen bg-[#fffbf0] pb-24 relative overflow-x-hidden font-sans selection:bg-orange-100">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <Leaf className="absolute top-10 -left-4 text-green-200/40 rotate-45 animate-float-slow" size={120} />
         <div className="absolute top-40 right-10 w-32 h-32 bg-yellow-100/40 rounded-full blur-3xl animate-pulse" />
         <div className="absolute bottom-20 left-10 w-40 h-40 bg-blue-100/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
         <Droplets className="absolute bottom-40 -right-4 text-blue-200/40 rotate-12 animate-float" size={100} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fffbf0]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="p-2 -ml-2 text-gray-500 hover:text-gray-800 hover:bg-white/50 rounded-full transition-all">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-black text-gray-700 tracking-tight">每日营养仪表盘</h1>
        <div className="w-8" />
      </header>

      <main className="max-w-lg mx-auto px-4 space-y-8 relative z-10">
        
        {/* Top Section: Overview */}
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-orange-50 relative overflow-hidden flex flex-col items-center">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-200 via-yellow-200 to-green-200" />
           
           <div className="flex justify-between w-full items-start mb-2">
              <h2 className="text-gray-500 font-bold text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-400" />
                今日饮食健康
              </h2>
              <button onClick={() => setShowGoalModal(true)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-[var(--primary)] transition-colors">
                 <Settings size={16} />
              </button>
           </div>

           <div className="relative mb-6 cursor-pointer group" onClick={() => setShowGoalModal(true)}>
              <RingProgress current={totals.calories} total={calorieGoal} />
              {/* Edit Hint */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-orange-400 font-bold whitespace-nowrap">
                点击修改目标
              </div>
           </div>

           {/* Completion Badge */}
           <div className={`px-4 py-1.5 rounded-full text-xs font-black tracking-wide ${
             totals.calories > calorieGoal ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'
           }`}>
             {totals.calories > calorieGoal ? '⚠️ 热量超标' : '✅ 正在进行中'}
           </div>
        </section>

        {/* AI Assistant Banner (Moved Up) */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[24px] p-4 flex items-center gap-4 border border-blue-100 shadow-sm relative overflow-hidden">
           <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm flex-shrink-0 relative z-10">
              <Bot size={24} />
           </div>
           <div className="flex-1 relative z-10">
              <p className="text-xs font-bold text-blue-400 uppercase mb-1 tracking-wider">AI 营养建议</p>
              <p className="text-sm font-medium text-gray-700 leading-snug">
                 {getAIAdvice()}
              </p>
           </div>
           {/* Decor */}
           <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-100/50 rounded-full blur-xl" />
        </section>

        {/* Middle Section: Nutrients */}
        <section className="grid grid-cols-3 gap-3">
           <NutrientCard 
             label="蛋白质" 
             current={totals.protein} 
             target={proteinGoal} 
             unit="g" 
             color="text-emerald-600" 
             bg="bg-emerald-50" 
             icon={Utensils}
           />
           <NutrientCard 
             label="碳水" 
             current={totals.carbs} 
             target={carbsGoal} 
             unit="g" 
             color="text-amber-600" 
             bg="bg-amber-50" 
             icon={Coffee}
           />
           <NutrientCard 
             label="脂肪" 
             current={totals.fat} 
             target={fatGoal} 
             unit="g" 
             color="text-rose-600" 
             bg="bg-rose-50" 
             icon={Flame}
           />
        </section>

        {/* Bottom Section: Meals */}
        <section className="space-y-4">
           <MealCard 
             title="早餐" 
             calories={dailyLogs?.filter(l => l.mealType === 'breakfast').reduce((a, b) => a + b.calories, 0) || 0}
             items={dailyLogs?.filter(l => l.mealType === 'breakfast') || []}
             onAdd={() => openAddForm('breakfast')}
             onDelete={handleDelete}
             icon={Coffee}
             colorClass="text-orange-500"
             bgClass="bg-orange-100"
           />
           <MealCard 
             title="午餐" 
             calories={dailyLogs?.filter(l => l.mealType === 'lunch').reduce((a, b) => a + b.calories, 0) || 0}
             items={dailyLogs?.filter(l => l.mealType === 'lunch') || []}
             onAdd={() => openAddForm('lunch')}
             onDelete={handleDelete}
             icon={Sun}
             colorClass="text-yellow-600"
             bgClass="bg-yellow-100"
           />
           <MealCard 
             title="晚餐" 
             calories={dailyLogs?.filter(l => l.mealType === 'dinner').reduce((a, b) => a + b.calories, 0) || 0}
             items={dailyLogs?.filter(l => l.mealType === 'dinner') || []}
             onAdd={() => openAddForm('dinner')}
             onDelete={handleDelete}
             icon={Moon}
             colorClass="text-indigo-500"
             bgClass="bg-indigo-100"
           />
           <MealCard 
             title="加餐" 
             calories={dailyLogs?.filter(l => l.mealType === 'snack').reduce((a, b) => a + b.calories, 0) || 0}
             items={dailyLogs?.filter(l => l.mealType === 'snack') || []}
             onAdd={() => openAddForm('snack')}
             onDelete={handleDelete}
             icon={Apple}
             colorClass="text-green-500"
             bgClass="bg-green-100"
           />
        </section>
      </main>

      {/* Goal Setting Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-scale-in">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black text-gray-800">调整营养计划</h3>
                 <button onClick={() => setShowGoalModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                    <Trash2 size={18} className="rotate-45" /> {/* Close icon visual hack */}
                 </button>
              </div>

              <div className="space-y-6">
                 {/* Plan Selection */}
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">选择计划模式</label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['normal', 'fat_loss', 'muscle_gain'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setEditingPlan(DEFAULT_PLANS[type])}
                            className={`py-3 rounded-xl text-xs font-bold transition-all ${
                               editingPlan.type === type 
                               ? 'bg-[var(--primary)] text-white shadow-md transform scale-105' 
                               : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                             {type === 'normal' && '均衡饮食'}
                             {type === 'fat_loss' && '减脂刷脂'}
                             {type === 'muscle_gain' && '增肌塑形'}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Manual Override */}
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">目标设定</label>
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
                       <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                          <span className="font-bold text-gray-700">总热量 (kcal)</span>
                          <input 
                             type="number"
                             value={editingPlan.calories}
                             onChange={(e) => setEditingPlan({...editingPlan, calories: parseInt(e.target.value) || 0, type: 'custom'})}
                             className="w-20 text-right font-black text-[var(--primary)] bg-transparent focus:outline-none focus:bg-white rounded px-1"
                          />
                       </div>
                       <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                             <p className="text-[10px] text-gray-400 font-bold mb-1">蛋白质 %</p>
                             <input 
                                type="number"
                                value={editingPlan.ratios.p}
                                onChange={(e) => setEditingPlan({
                                   ...editingPlan, 
                                   type: 'custom',
                                   ratios: { ...editingPlan.ratios, p: parseInt(e.target.value) || 0 }
                                })}
                                className="w-full text-center font-bold text-emerald-600 bg-emerald-50 rounded-lg py-1"
                             />
                          </div>
                          <div>
                             <p className="text-[10px] text-gray-400 font-bold mb-1">碳水 %</p>
                             <input 
                                type="number"
                                value={editingPlan.ratios.c}
                                onChange={(e) => setEditingPlan({
                                   ...editingPlan, 
                                   type: 'custom',
                                   ratios: { ...editingPlan.ratios, c: parseInt(e.target.value) || 0 }
                                })}
                                className="w-full text-center font-bold text-amber-600 bg-amber-50 rounded-lg py-1"
                             />
                          </div>
                          <div>
                             <p className="text-[10px] text-gray-400 font-bold mb-1">脂肪 %</p>
                             <input 
                                type="number"
                                value={editingPlan.ratios.f}
                                onChange={(e) => setEditingPlan({
                                   ...editingPlan, 
                                   type: 'custom',
                                   ratios: { ...editingPlan.ratios, f: parseInt(e.target.value) || 0 }
                                })}
                                className="w-full text-center font-bold text-rose-600 bg-rose-50 rounded-lg py-1"
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={savePlan}
                   className="w-full py-4 rounded-2xl bg-gray-800 text-white font-black hover:bg-black transition-colors shadow-lg"
                 >
                    保存计划
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-slide-up relative overflow-hidden">
             {/* Modal Header */}
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                   <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center text-white">
                      <Plus size={18} />
                   </div>
                   记录饮食
                </h3>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
             </div>

             <form onSubmit={handleAddEntry} className="space-y-5">
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">食物名称</label>
                   <div className="flex gap-2">
                      <input 
                        value={newEntry.name}
                        onChange={e => setNewEntry({...newEntry, name: e.target.value})}
                        placeholder="例如：燕麦拿铁"
                        className="flex-1 bg-gray-50 rounded-2xl px-4 py-3 font-bold text-gray-700 placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAnalyzeFood}
                        disabled={!newEntry.name || isAnalyzing}
                        className="px-4 rounded-2xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center gap-1 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                      >
                         {isAnalyzing ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : <Sparkles size={16} />}
                         AI 估算
                      </button>
                   </div>
                   {analysisReason && (
                      <div className="mt-2 bg-blue-50/50 p-3 rounded-xl text-[10px] font-medium text-blue-500 flex gap-2">
                         <Info size={14} className="flex-shrink-0" />
                         {analysisReason}
                      </div>
                   )}
                </div>

                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block ml-1">热量 (kcal)</label>
                   <input 
                      type="number"
                      value={newEntry.calories}
                      onChange={e => setNewEntry({...newEntry, calories: e.target.value})}
                      placeholder="AI 自动填充"
                      className="w-full bg-gray-50 rounded-2xl px-4 py-3 font-black text-orange-500 text-lg placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                   />
                </div>

                <div className="grid grid-cols-3 gap-3">
                   <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block text-center">蛋白质</label>
                      <input 
                        type="number"
                        value={newEntry.protein}
                        onChange={e => setNewEntry({...newEntry, protein: e.target.value})}
                        className="w-full bg-emerald-50 rounded-xl px-2 py-2 text-center font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block text-center">碳水</label>
                      <input 
                        type="number"
                        value={newEntry.carbs}
                        onChange={e => setNewEntry({...newEntry, carbs: e.target.value})}
                        className="w-full bg-amber-50 rounded-xl px-2 py-2 text-center font-bold text-amber-600 focus:ring-2 focus:ring-amber-100 outline-none"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block text-center">脂肪</label>
                      <input 
                        type="number"
                        value={newEntry.fat}
                        onChange={e => setNewEntry({...newEntry, fat: e.target.value})}
                        className="w-full bg-rose-50 rounded-xl px-2 py-2 text-center font-bold text-rose-600 focus:ring-2 focus:ring-rose-100 outline-none"
                      />
                   </div>
                </div>

                <button 
                  type="submit"
                  disabled={!newEntry.name}
                  className="w-full py-4 rounded-2xl bg-[var(--primary)] text-white font-black shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                   保存记录
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

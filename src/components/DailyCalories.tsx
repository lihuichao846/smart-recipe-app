'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Flame, Activity } from 'lucide-react';

export default function DailyCalories() {
  const dailyLogs = useLiveQuery(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return await db.calorieLogs
      .where('date')
      .aboveOrEqual(today)
      .toArray();
  });

  const totalCalories = dailyLogs?.reduce((acc, log) => acc + log.calories, 0) || 0;
  
  const userSettings = useLiveQuery(() => db.settings.get('daily_calorie_goal'));
  const goal = userSettings?.value || 2000;
  const percentage = Math.min((totalCalories / goal) * 100, 100);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');

  const openGoalEditor = () => {
    setTempGoal(goal.toString());
    setIsEditingGoal(true);
  };

  const saveGoal = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling
    const val = parseInt(tempGoal);
    if (!isNaN(val) && val > 0) {
      await db.settings.put({ id: 'daily_calorie_goal', value: val });
      setIsEditingGoal(false);
    }
  };

  return (
    <>
      <div className="absolute top-6 right-6 z-20 hidden md:block animate-fade-in">
        <div 
          onClick={openGoalEditor}
          className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-orange-100 flex flex-col gap-2 min-w-[200px] cursor-pointer hover:scale-105 transition-transform"
          title="点击修改每日目标"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Activity size={14} /> 今日摄入
            </span>
            <span className="text-[var(--primary)] font-black text-xl flex items-center gap-1">
              <Flame size={18} className="fill-orange-500 text-orange-500" />
              {totalCalories}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-300 to-red-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-right text-[10px] text-gray-400">
            目标: {goal} kcal
          </div>
        </div>
      </div>

      {/* Goal Edit Modal */}
      {isEditingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-scale-in" onClick={e => e.stopPropagation()}>
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
                onClick={(e) => { e.stopPropagation(); setIsEditingGoal(false); }}
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
    </>
  );
}

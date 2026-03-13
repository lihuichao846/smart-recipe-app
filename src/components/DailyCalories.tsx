'use client';

import React from 'react';
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
  // Default goal: 2000 kcal
  const goal = 2000;
  const percentage = Math.min((totalCalories / goal) * 100, 100);

  return (
    <div className="absolute top-6 right-6 z-20 hidden md:block animate-fade-in">
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-orange-100 flex flex-col gap-2 min-w-[200px]">
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
  );
}

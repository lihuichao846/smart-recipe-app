import Link from 'next/link';
import { ChefHat, Refrigerator, ArrowRight, Utensils } from 'lucide-react';
import FloatingFood from '@/components/FloatingFood';
import DailyCalories from '@/components/DailyCalories';

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Background Decor */}
      <FloatingFood />
      <DailyCalories />

      <div className="text-center mb-16 animate-fade-in relative z-10">
        <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-sm mb-6 border border-orange-50 rotate-3">
          <ChefHat className="text-[var(--primary)]" size={64} />
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-gray-800 tracking-tight mb-6">
          智能冰箱<span className="text-[var(--primary)]">管家</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          全方位的厨房助手，不仅能<span className="text-[var(--accent-hover)] font-medium">推荐食谱</span>，还能帮你<span className="text-blue-500 font-medium">管理库存</span>。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full px-4">
        {/* Card 1: Smart Recipe */}
        <Link href="/recipes" className="group cute-card p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Utensils size={120} className="text-[var(--accent)]" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-[var(--warning-bg)] rounded-2xl flex items-center justify-center mb-6 text-[var(--warning-text)] group-hover:scale-110 transition-transform duration-300 shadow-sm border border-[var(--warning-bg)]">
              <ChefHat size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">拍照生成食谱</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              不知道吃什么？拍一张冰箱食材的照片，AI 为你定制健康美味的专属食谱。
            </p>
            <div className="btn-cute btn-primary group-hover:gap-3">
              立即体验 <ArrowRight size={20} />
            </div>
          </div>
        </Link>

        {/* Card 2: Fridge Management */}
        <Link href="/fridge" className="group cute-card p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Refrigerator size={120} className="text-[var(--info-text)]" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-[var(--info-bg)] rounded-2xl flex items-center justify-center mb-6 text-[var(--info-text)] group-hover:scale-110 transition-transform duration-300 shadow-sm border border-[var(--info-bg)]">
              <Refrigerator size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">冰箱库存管理</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              智能识别并记录食材，自动提醒保质期，让你的冰箱井井有条，拒绝浪费。
            </p>
            <div className="btn-cute btn-secondary group-hover:gap-3">
              管理库存 <ArrowRight size={20} />
            </div>
          </div>
        </Link>
      </div>
      
      <footer className="mt-16 text-gray-400 text-sm">
        © 2026 Smart Kitchen AI. All rights reserved.
      </footer>
    </main>
  );
}

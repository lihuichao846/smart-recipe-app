import React from 'react';
import { ChefHat, Clock, Flame, ChevronRight, Youtube, MonitorPlay, Instagram } from 'lucide-react';

export interface Recipe {
  name: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  difficulty: string;
  calories?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  // Generate search URLs for different platforms
  const getSearchUrl = (platform: 'bilibili' | 'douyin' | 'xiaohongshu') => {
    const keyword = encodeURIComponent(`${recipe.name} 做法教程`);
    switch (platform) {
      case 'bilibili':
        return `https://search.bilibili.com/all?keyword=${keyword}`;
      case 'douyin':
        return `https://www.douyin.com/search/${keyword}`;
      case 'xiaohongshu':
        return `https://www.xiaohongshu.com/search_result?keyword=${keyword}`;
      default:
        return '#';
    }
  };

  return (
    <div className="cute-card bg-white overflow-hidden flex flex-col h-full animate-fade-in hover:-translate-y-2 hover:shadow-xl">
      {/* Card Header with decorative top border */}
      <div className="h-3 bg-[var(--primary)] w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4zIi8+PC9zdmc+')] opacity-50"></div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-black text-gray-800 leading-tight tracking-tight">{recipe.name}</h3>
          <span className="px-3 py-1 bg-[var(--warning-bg)] text-[var(--warning-text)] text-xs font-bold rounded-full uppercase tracking-wide border border-[var(--warning-bg)] shadow-sm">
            {recipe.difficulty}
          </span>
        </div>
        
        <div className="flex gap-4 mb-6 text-sm text-gray-500 border-b border-dashed border-gray-100 pb-4 font-medium">
          <div className="flex items-center gap-1.5">
            <Clock size={16} className="text-[var(--accent)]" />
            <span>{recipe.cookingTime}</span>
          </div>
          {recipe.calories && (
            <div className="flex items-center gap-1.5">
              <Flame size={16} className="text-red-400" />
              <span>{recipe.calories}</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--secondary)]"></span>
            所需食材
          </h4>
          <div className="flex flex-wrap gap-2">
            {recipe.ingredients.map((ing, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-[var(--background)] text-gray-600 border border-[var(--card-border)] rounded-lg text-sm font-bold">
                {ing}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto mb-6">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
            烹饪步骤
          </h4>
          <ol className="space-y-3 text-gray-600">
            {recipe.instructions.map((step, idx) => (
              <li key={idx} className="flex gap-3 text-sm leading-relaxed font-medium">
                <span className="flex-shrink-0 w-6 h-6 bg-[var(--primary-light)] text-[var(--primary-text)] rounded-full flex items-center justify-center text-xs font-black mt-0.5 shadow-sm">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Video Tutorial Links */}
        <div>
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
             <MonitorPlay size={14} className="text-[var(--accent)]" /> 视频教程
          </h4>
          <div className="flex gap-2">
            <a 
              href={getSearchUrl('bilibili')} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#fb7299]/10 text-[#fb7299] hover:bg-[#fb7299] hover:text-white rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
            >
              <Youtube size={16} /> {/* Using Youtube icon as proxy for video platform */}
              <span>B站</span>
            </a>
            <a 
              href={getSearchUrl('douyin')} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-black hover:text-white rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
            >
              <MonitorPlay size={16} />
              <span>抖音</span>
            </a>
            <a 
              href={getSearchUrl('xiaohongshu')} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#ff2442]/10 text-[#ff2442] hover:bg-[#ff2442] hover:text-white rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
            >
              <Instagram size={16} /> {/* Using Instagram icon as proxy for social platform */}
              <span>小红书</span>
            </a>
          </div>
        </div>
      </div>
      
      {/* Decorative bottom pattern/action */}
      <div className="bg-[var(--background)] px-6 py-3 border-t border-[var(--card-border)] flex justify-end">
         <div className="text-[var(--primary)] text-sm font-bold flex items-center gap-1 opacity-80">
            <ChefHat size={16} />
            <span>AI 推荐食谱</span>
         </div>
      </div>
    </div>
  );
}


import fs from 'fs';
import path from 'path';

// 定义菜谱结构
export interface Recipe {
  name: string;
  ingredients: string[];
  tags: string[];
}

// 缓存菜谱数据，避免每次请求都重新读取文件
let cachedRecipes: Recipe[] | null = null;

// 加载菜谱数据
const loadRecipes = (): Recipe[] => {
  if (cachedRecipes) return cachedRecipes;
  
  try {
    const filePath = path.join(process.cwd(), 'src/data/recipes.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    cachedRecipes = JSON.parse(fileContent);
    return cachedRecipes || [];
  } catch (error) {
    console.error('Failed to load recipe knowledge base:', error);
    return [];
  }
};

// 计算食材匹配度 (Jaccard Similarity 变体)
const calculateScore = (recipeIngredients: string[], userIngredients: string[]): number => {
  if (!userIngredients.length) return 0;
  
  // 标准化：移除空格，转小写（虽然中文不需要，但以防万一）
  const rIngs = recipeIngredients.map(i => i.trim());
  const uIngs = userIngredients.map(i => i.trim());
  
  // 计算交集数量
  let matchCount = 0;
  for (const u of uIngs) {
    // 模糊匹配：如果用户食材包含在菜谱食材中，或者反之
    if (rIngs.some(r => r.includes(u) || u.includes(r))) {
      matchCount++;
    }
  }
  
  // 得分逻辑：匹配数量越多越好，同时如果菜谱需要的额外食材越少越好
  // 这里简化为：匹配数量 / 菜谱总食材数量
  return matchCount / rIngs.length;
};

// 检索函数
export const retrieveRecipes = (userIngredients: string[], limit: number = 5): Recipe[] => {
  const allRecipes = loadRecipes();
  
  if (allRecipes.length === 0) return [];
  
  // 评分并排序
  const scoredRecipes = allRecipes.map(recipe => ({
    recipe,
    score: calculateScore(recipe.ingredients, userIngredients)
  }));
  
  // 过滤掉完全不匹配的 (score > 0)，然后按分数降序排列
  const topRecipes = scoredRecipes
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.recipe);
    
  return topRecipes;
};

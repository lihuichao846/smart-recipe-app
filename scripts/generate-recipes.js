
const fs = require('fs');
const path = require('path');

// 基础食材库
const baseIngredients = {
  proteins: ['鸡胸肉', '鸡腿', '牛肉', '五花肉', '排骨', '鱼', '虾', '豆腐', '鸡蛋', '鸭肉', '羊肉'],
  vegetables: ['西红柿', '黄瓜', '茄子', '土豆', '青椒', '胡萝卜', '西兰花', '菠菜', '白菜', '冬瓜', '香菇', '金针菇', '豆芽', '洋葱', '大蒜', '生姜'],
  staples: ['米饭', '面条', '馒头', '年糕', '粉丝'],
  seasonings: ['酱油', '醋', '盐', '糖', '料酒', '辣椒酱', '豆瓣酱', '咖喱', '黑胡椒', '孜然']
};

// 烹饪方式
const methods = ['红烧', '清蒸', '爆炒', '凉拌', '炖', '烤', '煎', '煮', '焖', '炸', '香辣', '麻辣', '糖醋', '蒜蓉', '咖喱', '黑椒'];

// 地区/风味
const styles = ['川味', '粤式', '湘味', '鲁菜', '东北', '日式', '韩式', '泰式', '意式', '家常'];

// 生成逻辑
const recipes = [];
const targetCount = 2500; // 目标生成数量

// 1. 组合生成 (Protein + Vegetable + Method)
for (const method of methods) {
  for (const protein of baseIngredients.proteins) {
    for (const veg of baseIngredients.vegetables) {
      recipes.push({
        name: `${method}${protein}配${veg}`,
        ingredients: [protein, veg, ...getRandomSeasonings()],
        tags: [method, '荤素搭配']
      });
      
      // 反向组合
      recipes.push({
        name: `${veg}炒${protein}`,
        ingredients: [veg, protein, ...getRandomSeasonings()],
        tags: ['炒菜', '家常']
      });
    }
  }
}

// 2. 纯素组合 (Veg + Veg + Method)
for (const method of methods) {
  for (let i = 0; i < baseIngredients.vegetables.length; i++) {
    for (let j = i + 1; j < baseIngredients.vegetables.length; j++) {
      const v1 = baseIngredients.vegetables[i];
      const v2 = baseIngredients.vegetables[j];
      recipes.push({
        name: `${method}${v1}${v2}`,
        ingredients: [v1, v2, ...getRandomSeasonings()],
        tags: [method, '素食']
      });
    }
  }
}

// 3. 特色风味组合 (Style + Protein/Veg + Method)
for (const style of styles) {
  for (const protein of baseIngredients.proteins) {
    recipes.push({
      name: `${style}${protein}`,
      ingredients: [protein, ...getRandomSeasonings()],
      tags: [style, '硬菜']
    });
  }
}

// 辅助函数：随机调料
function getRandomSeasonings() {
  const count = Math.floor(Math.random() * 3) + 2;
  const result = [];
  const source = [...baseIngredients.seasonings];
  for(let i=0; i<count; i++) {
    if(source.length === 0) break;
    const idx = Math.floor(Math.random() * source.length);
    result.push(source[idx]);
    source.splice(idx, 1);
  }
  return result;
}

// 去重并截取
const uniqueRecipes = Array.from(new Set(recipes.map(r => JSON.stringify(r)))).map(s => JSON.parse(s));
const finalRecipes = uniqueRecipes.slice(0, Math.max(uniqueRecipes.length, targetCount));

console.log(`Generated ${finalRecipes.length} recipes.`);

// 写入文件
const outputDir = path.join(__dirname, '../src/data');
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'recipes.json'), JSON.stringify(finalRecipes, null, 2));
console.log('Recipes saved to src/data/recipes.json');


const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, '../all_recipies.csv');
const outputFilePath = path.join(__dirname, '../src/data/recipes.json');

// 简单的 CSV 解析器，处理带引号的字段
function parseCSVLine(text) {
  const result = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  result.push(cell);
  return result;
}

// 简单的停用词列表（用于从标题提取食材时过滤）
const stopWords = new Set([
  'and', 'with', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'a', 'an', 
  'fryer', 'air', 'recipe', 'easy', 'quick', 'best', 'delicious', 'style',
  'how', 'make', 'cook', 'cooking', 'minutes', 'dinner', 'lunch', 'breakfast'
]);

function extractIngredientsFromTitle(title) {
  if (!title) return [];
  // 移除标点，转小写，拆分
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w)); // 过滤短词和停用词
}

try {
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = fileContent.split('\n');
  
  // 获取表头
  const headers = parseCSVLine(lines[0].trim());
  const nameIdx = headers.indexOf('recipe_name');
  const descIdx = headers.indexOf('description');
  const calIdx = headers.indexOf('calories');
  const timeIdx = headers.indexOf('total_time');

  const recipes = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row = parseCSVLine(line);
    const name = row[nameIdx];
    
    if (!name) continue;

    // 由于 CSV 缺少 ingredients 列，我们尝试从标题提取关键词作为食材
    const ingredients = extractIngredientsFromTitle(name);
    
    const tags = [];
    if (row[calIdx]) tags.push(`${row[calIdx]} cal`);
    if (row[timeIdx]) tags.push(row[timeIdx]);
    tags.push('Imported');

    recipes.push({
      name: name,
      ingredients: ingredients, // 近似处理
      tags: tags,
      description: row[descIdx] // 保留描述备用
    });
  }

  // 写入 JSON
  fs.writeFileSync(outputFilePath, JSON.stringify(recipes, null, 2));
  console.log(`Successfully imported ${recipes.length} recipes from CSV.`);
  console.log('Note: Ingredients were extracted from titles as the CSV lacked an ingredients column.');

} catch (err) {
  console.error('Error processing CSV:', err);
}

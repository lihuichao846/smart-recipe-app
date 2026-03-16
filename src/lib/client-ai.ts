import OpenAI from 'openai';
import { retrieveRecipes } from './recipe-retriever';

// Client-side AI Helper
// WARNING: This exposes your API key to the client. Only use for local/personal apps.
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const baseURL = process.env.NEXT_PUBLIC_OPENAI_BASE_URL;
const visionModel = process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o";

// DeepSeek Configuration (Fallback to OpenAI config if not present)
const deepseekApiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || apiKey;
const deepseekBaseURL = process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL || baseURL;
const recipeModel = process.env.NEXT_PUBLIC_DEEPSEEK_MODEL || visionModel;

// Initialize OpenAI clients
const visionClient = new OpenAI({
  apiKey: apiKey || 'dummy-key',
  baseURL: baseURL || undefined,
  dangerouslyAllowBrowser: true 
});

const recipeClient = new OpenAI({
    apiKey: deepseekApiKey || 'dummy-key',
    baseURL: deepseekBaseURL || undefined,
    dangerouslyAllowBrowser: true
});

export interface IdentifiedItem {
  name: string;
  quantity: string;
  category: string;
}

export async function identifyIngredients(imageData: string): Promise<IdentifiedItem[]> {
  if (!apiKey) {
    throw new Error('Missing NEXT_PUBLIC_OPENAI_API_KEY');
  }

  try {
    const response = await visionClient.chat.completions.create({
      model: visionModel,
      messages: [
        {
          role: "system",
          content: `你是一个专业的食材管理助手。请识别图片中的所有食材，并尽可能估算其数量。
          
          请返回合法的JSON格式，结构如下:
          {
            "items": [
              {
                "name": "食材名称",
                "quantity": "估算数量(如: 2个, 500g)",
                "category": "分类(如: 蔬菜, 水果, 肉类, 奶制品, 调味品, 其他)"
              }
            ]
          }
          不要包含Markdown代码块标记。`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "识别这些食材，帮我录入冰箱库存。" },
            {
              type: "image_url",
              image_url: {
                "url": imageData,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    let content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Failed to generate content');
    }

    // Clean up potential markdown code blocks
    content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(content);
    return result.items || [];
  } catch (error) {
    console.error('Client AI Identification Error:', error);
    throw error;
  }
}

export interface GeneratedRecipe {
  name: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  difficulty: string;
  calories: string;
}

export async function generateRecipes(ingredients: string[], preferences?: string): Promise<{ recipes: GeneratedRecipe[], model: string }> {
  if (!deepseekApiKey) {
    throw new Error('Missing NEXT_PUBLIC_DEEPSEEK_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY');
  }

  // RAG Retrieval (Client-side now!)
  const retrievedRecipes = retrieveRecipes(ingredients, 5);
  const ragContext = retrievedRecipes.length > 0 
    ? `\n\n参考菜谱库中的相关菜谱（仅供参考，请根据实际食材调整）：\n${retrievedRecipes.map((r: any) => `- ${r.name} (食材: ${r.ingredients.join(', ')})`).join('\n')}`
    : '';

  try {
    const response = await recipeClient.chat.completions.create({
      model: recipeModel,
      messages: [
        {
          role: "system",
          content: `你是一个专业的营养师和厨师。用户提供了冰箱里的现有食材列表。请根据这些食材，推荐4-6个丰富多样的菜谱（包括主食、汤品、快手菜等）。你可以适当补充一些家中常备的调料或配菜。
          请务必返回合法的JSON格式字符串，不要包含Markdown代码块标记。
          
          JSON结构必须如下:
          {
            "recipes": [
              {
                "name": "菜名",
                "ingredients": ["所需食材1", "所需食材2"],
                "instructions": ["步骤1", "步骤2"],
                "cookingTime": "预计时间",
                "difficulty": "难度",
                "calories": "卡路里估算"
              }
            ]
          }`
        },
        {
          role: "user",
          content: `我的冰箱里有以下食材：${ingredients.join(', ')}。请推荐一些菜谱。${preferences ? `用户的额外要求：${preferences}` : ''}${ragContext}`
        }
      ],
      max_tokens: 4096,
    });

    let content = response.choices[0].message.content;
    if (!content) throw new Error('Failed to generate recipes');

    // Clean up potential markdown code blocks
    content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    // Attempt to parse JSON
    // Sometimes content might have leading/trailing text, so try to extract JSON
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
        content = content.substring(start, end + 1);
    }

    const result = JSON.parse(content);
    return {
      recipes: result.recipes || [],
      model: recipeModel
    };
  } catch (error) {
    console.error('Client AI Recipe Generation Error:', error);
    throw error;
  }
}

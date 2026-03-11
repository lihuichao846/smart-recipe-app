import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define interfaces for type safety
interface VisionResult {
  ingredients: string[];
}

interface RecipeResult {
  recipes: any[];
}

export async function POST(request: Request) {
  try {
    const { image, ingredients: inputIngredients, preferences } = await request.json();

    if (!image && (!inputIngredients || inputIngredients.length === 0)) {
      return NextResponse.json({ error: 'No image or ingredients provided' }, { status: 400 });
    }

    // 1. Initialize Clients
    // Vision Client (OpenAI or compatible)
    const visionApiKey = process.env.OPENAI_API_KEY;
    const visionBaseURL = process.env.OPENAI_BASE_URL;
    const visionModel = process.env.OPENAI_MODEL || "gpt-4o";
    
    const visionClient = new OpenAI({ 
      apiKey: visionApiKey,
      baseURL: visionBaseURL || undefined
    });

    // DeepSeek Client (for text/recipe generation)
    // If DEEPSEEK_API_KEY is not set, fallback to visionClient
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY || visionApiKey;
    const deepseekBaseURL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"; // Default DeepSeek API URL
    const deepseekModel = process.env.DEEPSEEK_MODEL || "deepseek-chat"; 

    const recipeClient = process.env.DEEPSEEK_API_KEY 
      ? new OpenAI({ apiKey: deepseekApiKey, baseURL: deepseekBaseURL })
      : visionClient;
    
    const recipeModel = process.env.DEEPSEEK_API_KEY ? deepseekModel : visionModel;

    let finalIngredients: string[] = inputIngredients || [];
    let usedVisionModel = "";

    // 2. Image Analysis Step (if image provided)
    if (image) {
      usedVisionModel = visionModel;
      const visionMessages: any[] = [
        {
          role: "system",
          content: `你是一个专业的食材识别助手。请仔细观察用户提供的冰箱食材图片，识别其中所有的食材。
          请务必返回合法的JSON格式字符串，不要包含Markdown代码块标记。
          
          JSON结构必须如下:
          {
            "ingredients": ["食材1", "食材2", "食材3"]
          }`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "请识别图中的所有食材。" },
            {
              type: "image_url",
              image_url: { "url": image },
            },
          ],
        },
      ];

      const visionResponse = await visionClient.chat.completions.create({
        model: visionModel,
        messages: visionMessages,
        max_tokens: 1024,
        response_format: { type: "json_object" } 
      });

      const visionContent = visionResponse.choices[0].message.content;
      if (!visionContent) throw new Error('Failed to analyze image');
      
      try {
        const parsed = JSON.parse(visionContent);
        finalIngredients = parsed.ingredients || [];
      } catch (e) {
        console.error("Failed to parse vision response", e);
        // Fallback or error
        throw new Error('Failed to parse ingredients from image');
      }
    }

    // 3. Recipe Generation Step (using DeepSeek or Fallback)
    const recipeMessages: any[] = [
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
        content: `我的冰箱里有以下食材：${finalIngredients.join(', ')}。请推荐一些菜谱。${preferences ? `用户的额外要求：${preferences}` : ''}`
      }
    ];

    const recipeResponse = await recipeClient.chat.completions.create({
      model: recipeModel,
      messages: recipeMessages,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    });

    let recipeContent = recipeResponse.choices[0].message.content;
    if (!recipeContent) throw new Error('Failed to generate recipes');

    // Clean up potential markdown code blocks if the model adds them (DeepSeek sometimes does despite instructions)
    recipeContent = recipeContent.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    const recipeResult = JSON.parse(recipeContent);
    
    // Construct final response
    return NextResponse.json({
      ingredients: finalIngredients,
      recipes: recipeResult.recipes,
      model: `${usedVisionModel ? usedVisionModel + ' + ' : ''}${recipeModel}`
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

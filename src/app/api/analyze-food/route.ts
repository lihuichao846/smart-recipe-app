import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const { foodName } = await request.json();

    if (!foodName) {
      return NextResponse.json({ error: 'Please provide a food name' }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const baseURL = process.env.DEEPSEEK_BASE_URL || process.env.NEXT_PUBLIC_DEEPSEEK_BASE_URL || process.env.OPENAI_BASE_URL || process.env.NEXT_PUBLIC_OPENAI_BASE_URL;
    // If GLM-5 fails on the current BaseURL, we can safely fall back to the environment variable models.
    // Use Qwen2.5-7B-Instruct for ultra-fast response as requested by user
    const model = process.env.GLM_MODEL || "Qwen/Qwen2.5-7B-Instruct";

    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    // Fix: SiliconFlow/DeepSeek compatibility - ensure baseURL ends with /v1
    let finalBaseURL = baseURL;
    // Common issue: user provides 'https://api.siliconflow.cn' but SDK needs 'https://api.siliconflow.cn/v1'
    if (finalBaseURL && !finalBaseURL.endsWith('/v1')) {
       finalBaseURL = finalBaseURL.replace(/\/+$/, '') + '/v1';
    }

    const client = new OpenAI({ 
      apiKey,
      baseURL: finalBaseURL || undefined
    });

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `你是一个专业的营养师助手。请根据用户提供的食物名称（可能包含份量），进行细节的营养数据分析并估算其营养成分。
          
          请返回严格的 JSON 格式，不要包含 Markdown 标记。结构如下:
          {
            "calories": 0, // 热量 (kcal)，整数
            "protein": 0, // 蛋白质 (g)，保留1位小数
            "carbs": 0, // 碳水化合物 (g)，保留1位小数
            "fat": 0, // 脂肪 (g)，保留1位小数
            "reasoning": "简短说明估算依据（例如：基于1人份红烧肉约200g估算）"
          }
          
          重要：如果用户未提供具体份量，请默认按“正常成年人的一人份（1 serving）”进行估算。`
        },
        {
          role: "user",
          content: `估算这个食物的营养：${foodName}`
        }
      ],
      // GLM-5/DeepSeek specific parameters
      temperature: 0.1, // Lower temperature for more consistent and faster JSON output
      // Note: While standard OpenAI SDK doesn't have a direct 'disable thinking' flag, 
      // setting top_p very low combined with temperature=0.1 forces the model to take 
      // the most direct path without divergent reasoning.
      top_p: 0.1,
      max_tokens: 500,
    });

    let content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Failed to generate content');
    }

    // Double check JSON parsing in case model wraps it
    try {
      const result = JSON.parse(content);
      return NextResponse.json(result);
    } catch (e) {
      // Fallback cleanup if json_object mode fails or model adds text
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return NextResponse.json(JSON.parse(cleaned.substring(start, end + 1)));
      }
      throw new Error('Invalid JSON response');
    }

  } catch (error) {
    console.error('Error analyzing food:', error);
    return NextResponse.json(
      { error: 'Failed to analyze food', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

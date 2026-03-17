import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { estimateExpiryDate } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || process.env.NEXT_PUBLIC_OPENAI_BASE_URL;
    const model = process.env.OPENAI_MODEL || process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o";

    const openai = new OpenAI({ 
      apiKey,
      baseURL: baseURL || undefined
    });

    const response = await openai.chat.completions.create({
      model: model,
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
                "url": image,
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
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error identifying ingredients:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  defaultQuery: undefined,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: '请提供文本内容' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'glm-4-flash',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文字优化助手，可以帮助改进文本的表达，使其更加专业、清晰和有说服力。',
        },
        {
          role: 'user',
          content: `请优化以下文本，使其更加专业和易于理解，但保持原意不变：\n\n${text}`,
        },
      ],
      temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.7,
      max_tokens: Number(process.env.OPENAI_MAX_TOKENS) || 1000,
      stream: false,
    });

    const improvedText = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ text: improvedText });
  } catch (error: any) {
    console.error('AI 处理出错:', error);
    // 检查是否是网络错误
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { 
          error: 'AI 服务连接超时',
          details: '请检查网络连接或稍后重试',
          code: error.code,
        },
        { status: 503 }
      );
    }
    // 检查是否是 API 密钥错误
    if (error.status === 401) {
      return NextResponse.json(
        { 
          error: 'API 认证失败',
          details: '请检查 API 密钥是否正确',
          code: 'AUTH_ERROR',
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { 
        error: 'AI 处理出错',
        details: error.message || '未知错误',
        code: error.code || 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
} 
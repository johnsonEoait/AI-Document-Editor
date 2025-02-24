import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text, prompt } = await req.json();

    if (!text || !prompt) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "你是一个专业的文本处理助手，请按照用户的要求处理文本。保持专业、准确、简洁的风格。"
        },
        {
          role: "user",
          content: `请按照以下要求处理文本：\n\n要求：${prompt}\n\n文本：${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = completion.choices[0]?.message?.content;

    if (!result) {
      return NextResponse.json(
        { error: 'AI 返回结果为空' },
        { status: 500 }
      );
    }

    return NextResponse.json({ text: result });
  } catch (error: any) {
    console.error('AI 处理出错:', error);
    return NextResponse.json(
      { error: error.message || 'AI 处理出错' },
      { status: 500 }
    );
  }
} 
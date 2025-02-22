import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文本总结助手，可以将长文本总结为简洁的要点。',
        },
        {
          role: 'user',
          content: `请总结以下文本的主要内容，提取关键信息：\n\n${text}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const summarizedText = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ text: summarizedText });
  } catch (error) {
    console.error('AI 处理出错:', error);
    return NextResponse.json(
      { error: 'AI 处理出错' },
      { status: 500 }
    );
  }
} 
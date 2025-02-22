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
          content: '你是一个专业的文字优化助手，可以帮助改进文本的表达，使其更加专业、清晰和有说服力。',
        },
        {
          role: 'user',
          content: `请优化以下文本，使其更加专业和易于理解，但保持原意不变：\n\n${text}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const improvedText = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ text: improvedText });
  } catch (error) {
    console.error('AI 处理出错:', error);
    return NextResponse.json(
      { error: 'AI 处理出错' },
      { status: 500 }
    );
  }
} 
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
          content: '你是一个专业的内容扩展助手，可以基于给定的文本，生成更详细的内容描述。',
        },
        {
          role: 'user',
          content: `请基于以下文本，生成更详细的内容描述，添加相关的细节和例子：\n\n${text}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    const expandedText = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ text: expandedText });
  } catch (error) {
    console.error('AI 处理出错:', error);
    return NextResponse.json(
      { error: 'AI 处理出错' },
      { status: 500 }
    );
  }
} 
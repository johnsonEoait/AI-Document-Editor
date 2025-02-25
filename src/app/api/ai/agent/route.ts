import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  defaultQuery: undefined,
});

// 定义工具类型
type Tool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: {
        [key: string]: {
          type: string;
          description: string;
        };
      };
      required: string[];
    };
  };
};

// 定义可用的工具
const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'processText',
      description: '处理用户选中的文本,如翻译、总结、改写等',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: '需要处理的文本内容'
          },
          action: {
            type: 'string',
            description: '要执行的操作,如翻译、总结、改写等'
          }
        },
        required: ['text', 'action']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generateContent',
      description: '根据用户的提示生成新的内容',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: '用户的提示词,描述需要生成什么样的内容'
          },
          context: {
            type: 'string',
            description: '可选的上下文信息'
          }
        },
        required: ['prompt']
      }
    }
  }
];

export async function POST(request: Request) {
  try {
    const { text, prompt } = await request.json();

    // 根据是否有text参数来判断是处理文本还是生成内容
    const messages: ChatCompletionMessageParam[] = text ? [
      {
        role: 'system',
        content: `你是一个专业的 AI 助手,擅长处理各种文本任务。请根据用户的提示词处理所提供的文本。
保持输出的专业性和准确性，请直接输出markdown格式，不需要包裹在markdown代码块中,只支持、标题、表格格式。`
      },
      {
        role: 'user',
        content: `请按照以下要求处理文本：\n\n要求：${prompt}\n\n文本：${text}`
      }
    ] : [
      {
        role: 'system',
        content: `你是一个专业的 AI 助手,擅长生成各种类型的内容。请根据用户的提示词生成内容。
保持输出的专业性和准确性。
直接输出生成的内容,不要包含任何解释或说明，请直接输出markdown格式，不需要包裹在markdown代码块中,支持标题、表格格式。`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'glm-4-flash',
      messages,
      stream: true,
      temperature: Number(process.env.OPENAI_TEMPERATURE) || 0.7,
      max_tokens: Number(process.env.OPENAI_MAX_TOKENS) || 2000,
    });

    // 创建一个 TransformStream 来处理数据
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          controller.enqueue(encoder.encode(content));
        }
      },
    });

    // 将 OpenAI 的响应流传输到我们的 transform stream
    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    return new Response(readableStream.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('AI 处理出错:', error);
    
    // 网络错误处理
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
    
    // API 认证错误处理
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

    // 其他错误处理
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

// 处理文本的函数
async function processText(text: string, action: string): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `你是一个专业的文本处理助手。请${action}下面的文本。保持专业、准确、简洁的风格。直接输出处理后的内容,不要包含任何解释。`
    },
    {
      role: 'user',
      content: text
    }
  ];

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'glm-4-flash',
    messages,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || '';
}

// 生成内容的函数
async function generateContent(prompt: string, context?: string): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: '你是一个专业的内容生成助手。请根据提示生成内容。保持专业、准确、简洁的风格。直接输出生成的内容,不要包含任何解释。'
    },
    {
      role: 'user',
      content: context ? `上下文：${context}\n\n需求：${prompt}` : prompt
    }
  ];

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'glm-4-flash',
    messages,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || '';
} 
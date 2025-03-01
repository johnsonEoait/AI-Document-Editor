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
  },
  {
    type: 'function',
    function: {
      name: 'formatText',
      description: '使用ProseMirror语法格式化文本,如标题、列表、加粗、斜体等',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: '需要格式化的文本内容'
          },
          format: {
            type: 'string',
            description: '要应用的格式,如h1、h2、h3、list、bold、italic、code、blockquote等'
          }
        },
        required: ['text', 'format']
      }
    }
  }
];

export async function POST(request: Request) {
  try {
    const { text, prompt, mode } = await request.json();

    // 获取当前文档的上下文信息
    const documentContext = text ? `当前文档内容：\n${text}\n\n` : '';
    
    // 根据模式参数来判断是处理文本、生成内容还是格式化文本
    let messages: ChatCompletionMessageParam[];
    
    if (mode === 'format') {
      // 格式化文本模式
      messages = [
        {
          role: 'system',
          content: `你是一个专业的文本格式化助手。请使用ProseMirror语法将下面的文本格式化为"${prompt}"格式。
以下是你需要了解的上下文信息：
1. 用户正在编辑一篇文档，并选择了一段文本
2. 用户希望你对选中的文本应用"${prompt}"格式
3. 你只需要输出格式化后的文本内容，不需要解释你的处理过程
4. 你的输出将直接替换用户选中的文本

请注意：
- 只输出格式化后的内容，不要添加任何解释、前言或结论
- 直接输出格式化后的内容，不要包含任何解释说明
- 不要使用markdown代码块包裹你的输出
- 不要使用HTML标签，只使用纯ProseMirror语法
- 根据格式要求正确应用ProseMirror语法：
  - h1: # 标题
  - h2: ## 标题
  - h3: ### 标题
  - h4: #### 标题
  - h5: ##### 标题
  - h6: ###### 标题
  - bold: **文本**
  - italic: *文本*
  - code: \`代码\`
  - blockquote: > 引用文本
  - list: - 列表项
  - numbered-list: 1. 列表项
  - link: [链接文本](URL)
  - table: | 表头 | 表头 |\\n| --- | --- |\\n| 内容 | 内容 |
- 保持输出的专业性和准确性
- 你的输出将直接替换用户选中的文本，所以确保输出的内容是完整的
- 重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法`
        },
        {
          role: 'user',
          content: `${documentContext}我选中了上述文档中的一段文本，需要你将其格式化为"${prompt}"格式：

【需要格式化的文本】
${text}

【输出要求】
只输出格式化后的内容，不要包含任何解释说明。你的输出将直接替换我选中的文本。
重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法。`
        }
      ];
    } else if (text) {
      // 处理文本模式
      messages = [
        {
          role: 'system',
          content: `你是一个专业的 AI 助手,擅长处理各种文本任务。请根据用户的提示词处理所提供的文本。
以下是你需要了解的上下文信息：
1. 用户正在编辑一篇文档，并选择了一段文本
2. 用户希望你对选中的文本进行处理（如翻译、总结、改写等）
3. 用户提供了具体的处理要求
4. 你只需要输出处理后的文本内容，不需要解释你的处理过程

请注意：
- 只输出处理后的内容，不要添加任何解释、前言或结论
- 直接输出处理后的内容，不要包含任何解释说明
- 不要使用markdown代码块包裹你的输出
- 不要使用HTML标签，只使用纯ProseMirror语法
- 可以使用ProseMirror格式（如列表、标题、表格等）来格式化你的输出
- 保持输出的专业性和准确性
- 你的输出将直接替换用户选中的文本，所以确保输出的内容是完整的
- 如果用户要求格式化文本，请使用适当的ProseMirror语法（如# 标题、**加粗**、*斜体*等）
- 重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法`
        },
        {
          role: 'user',
          content: `${documentContext}我选中了上述文档中的一段文本，需要你按照以下要求处理这段文本：

【处理要求】
${prompt}

【需要处理的文本】
${text}

【输出要求】
只输出处理后的内容，不要包含任何解释说明。你的输出将直接替换我选中的文本。
重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法。`
        }
      ];
    } else {
      // 生成内容模式
      messages = [
        {
          role: 'system',
          content: `你是一个专业的 AI 助手,擅长生成各种类型的内容。请根据用户的提示词生成内容。
以下是你需要了解的上下文信息：
1. 用户正在编辑一篇文档，并希望在当前位置生成新的内容
2. 用户提供了具体的内容要求
3. 你只需要输出生成的内容，不需要解释你的生成过程
4. 你的输出将直接插入到用户的文档中

请注意：
- 只输出生成的内容，不要添加任何解释、前言或结论
- 直接输出生成的内容，不要包含任何解释说明
- 不要使用markdown代码块包裹你的输出
- 不要使用HTML标签，只使用纯ProseMirror语法
- 可以使用ProseMirror格式（如标题、列表、表格等）来格式化你的输出
- 保持输出的专业性和准确性
- 你的输出将直接插入到用户的文档中，所以确保输出的内容是完整的
- 如果用户要求格式化文本，请使用适当的ProseMirror语法（如# 标题、**加粗**、*斜体*等）
- 重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法`
        },
        {
          role: 'user',
          content: `${documentContext}我希望你在我的文档中生成一段新内容：

【生成内容要求】
${prompt}

【当前上下文】
${text || "文档开始处或当前光标位置"}

【输出要求】
只输出生成的内容，不要包含任何解释说明。你的输出将直接插入到我的文档中。
重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法。`
        }
      ];
    }

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
  // 获取当前文档的上下文信息
  const documentContext = text ? `当前文档内容：\n${text}\n\n` : '';
  
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `你是一个专业的文本处理助手。请${action}下面的文本。
以下是你需要了解的上下文信息：
1. 用户正在编辑一篇文档，并选择了一段文本
2. 用户希望你对选中的文本进行"${action}"处理
3. 你只需要输出处理后的文本内容，不需要解释你的处理过程
4. 你的输出将直接替换用户选中的文本

请注意：
- 只输出处理后的内容，不要添加任何解释、前言或结论
- 直接输出处理后的内容，不要包含任何解释说明
- 不要使用markdown代码块包裹你的输出
- 不要使用HTML标签，只使用纯ProseMirror语法
- 可以使用ProseMirror格式（如列表、标题、表格等）来格式化你的输出
- 保持专业、准确、简洁的风格
- 你的输出将直接替换用户选中的文本，所以确保输出的内容是完整的
- 重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法`
    },
    {
      role: 'user',
      content: `${documentContext}我选中了上述文档中的一段文本，需要你进行${action}处理：

【需要${action}的文本】
${text}

【输出要求】
只输出处理后的内容，不要包含任何解释说明。你的输出将直接替换我选中的文本。
重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法。`
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
  // 获取当前文档的上下文信息
  const documentContext = context ? `当前文档内容：\n${context}\n\n` : '';
  
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `你是一个专业的内容生成助手。请根据提示生成内容。
以下是你需要了解的上下文信息：
1. 用户正在编辑一篇文档，并希望在当前位置生成新的内容
2. 用户提供了具体的内容要求和可能的上下文信息
3. 你只需要输出生成的内容，不需要解释你的生成过程
4. 你的输出将直接插入到用户的文档中

请注意：
- 只输出生成的内容，不要添加任何解释、前言或结论
- 直接输出生成的内容，不要包含任何解释说明
- 不要使用markdown代码块包裹你的输出
- 不要使用HTML标签，只使用纯ProseMirror语法
- 可以使用ProseMirror格式（如标题、列表、表格等）来格式化你的输出
- 保持专业、准确、简洁的风格
- 你的输出将直接插入到用户的文档中，所以确保输出的内容是完整的
- 重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法`
    },
    {
      role: 'user',
      content: context ? 
        `${documentContext}我希望你在我的文档中生成一段新内容：

【上下文信息】
${context}

【生成内容要求】
${prompt}

【输出要求】
只输出生成的内容，不要包含任何解释说明。你的输出将直接插入到我的文档中。
重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法。` : 
        `我希望你在我的文档中生成一段新内容：

【生成内容要求】
${prompt}

【输出要求】
只输出生成的内容，不要包含任何解释说明。你的输出将直接插入到我的文档中。
重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法。`
    }
  ];

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'glm-4-flash',
    messages,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || '';
}

// 格式化文本的函数
async function formatText(text: string, format: string): Promise<string> {
  // 获取当前文档的上下文信息
  const documentContext = text ? `当前文档内容：\n${text}\n\n` : '';
  
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `你是一个专业的文本格式化助手。请使用ProseMirror语法将下面的文本格式化为"${format}"格式。
以下是你需要了解的上下文信息：
1. 用户正在编辑一篇文档，并选择了一段文本
2. 用户希望你对选中的文本应用"${format}"格式
3. 你只需要输出格式化后的文本内容，不需要解释你的处理过程
4. 你的输出将直接替换用户选中的文本

请注意：
- 只输出格式化后的内容，不要添加任何解释、前言或结论
- 直接输出格式化后的内容，不要包含任何解释说明
- 不要使用markdown代码块包裹你的输出
- 不要使用HTML标签，只使用纯ProseMirror语法
- 保持输出的专业性和准确性
- 你的输出将直接替换用户选中的文本，所以确保输出的内容是完整的
- 重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法`
    },
    {
      role: 'user',
      content: `${documentContext}我选中了上述文档中的一段文本，需要你将其格式化为"${format}"格式：

【需要格式化的文本】
${text}

【输出要求】
只输出格式化后的内容，不要包含任何解释说明。你的输出将直接替换我选中的文本。
重要：不要使用HTML标签（如<p>、<strong>等），只使用纯ProseMirror语法。`
    }
  ];

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'glm-4-flash',
    messages,
    temperature: 0.3, // 使用较低的温度以获得更确定性的结果
  });

  return completion.choices[0]?.message?.content || '';
} 
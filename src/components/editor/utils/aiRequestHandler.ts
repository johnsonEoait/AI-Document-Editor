import { AIRequestParams } from '../types/aiToolbar';

/**
 * 处理AI请求并返回流式响应
 * @param params 请求参数
 * @param onChunk 处理每个数据块的回调
 * @returns 处理结果的Promise
 */
export const handleAIRequest = async (
  params: AIRequestParams,
  onChunk: (chunk: string) => void
): Promise<void> => {
  try {
    // 添加明确的指示，要求使用Markdown格式
    let actualPrompt = params.prompt;
    if (params.mode !== 'format') {
      actualPrompt += " (请使用Markdown格式输出，不要使用HTML标签)";
    }
    
    const response = await fetch('/api/ai/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: params.text,
        prompt: actualPrompt,
        mode: params.mode
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.details || '未知错误');
    }

    if (!response.body) {
      throw new Error('返回的响应没有内容');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // 流式显示内容
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      buffer += chunk;

      // 只在完整的行结束时更新内容
      if (buffer.includes('\n')) {
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行
        onChunk(lines.join('\n') + '\n');
      }
    }

    // 处理剩余的buffer
    if (buffer) {
      onChunk(buffer);
    }
  } catch (error: any) {
    console.error('AI 处理出错:', error);
    throw error;
  }
}; 
'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Wand2, Send, X, Check, RotateCcw, Loader2 } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// 扩展 Editor 类型
declare module '@tiptap/react' {
  interface Editor {
    aiToolbar?: {
      show: () => void;
    };
  }
}

interface FloatingAIToolbarProps {
  editor: Editor;
  onLoadingChange: (isLoading: boolean) => void;
}

export const FloatingAIToolbar = ({ editor, onLoadingChange }: FloatingAIToolbarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectionRef = useRef<{ from: number; to: number } | null>(null);
  const pluginKey = new PluginKey('aiHighlight');

  // 创建高亮插件
  useEffect(() => {
    if (!editor) return;

    const plugin = new Plugin({
      key: pluginKey,
      props: {
        decorations: (state) => {
          if (!selectionRef.current) return DecorationSet.empty;
          
          const { from, to } = selectionRef.current;
          return DecorationSet.create(state.doc, [
            Decoration.inline(from, to, {
              class: 'ai-processing-highlight',
            }),
          ]);
        },
      },
    });

    editor.registerPlugin(plugin);

    return () => {
      editor.unregisterPlugin(pluginKey);
    };
  }, [editor]);

  // 添加高亮样式
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const style = document.createElement('style');
    style.innerHTML = `
      .ai-processing-highlight {
        background-color: rgba(59, 130, 246, 0.1);
        border-radius: 0.25rem;
        padding: 0.125rem 0;
        border-bottom: 2px solid rgb(59, 130, 246);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 添加手动触发方法
  const showToolbar = useCallback(() => {
    if (!editor) return;

    const { state } = editor;
    const { selection } = state;
    const { ranges } = selection;

    const hasSelection = !selection.empty;
    let from = 0;
    let to = 0;

    if (hasSelection) {
      const node = editor.state.doc.nodeAt(selection.from);
      if (node && (node.type.name === 'customImage' || node.type.name === 'table')) return;

      from = Math.min(...ranges.map((range) => range.$from.pos));
      to = Math.max(...ranges.map((range) => range.$to.pos));
      
      if (from === to) return;

      // 保存选中范围并触发高亮更新
      selectionRef.current = { from, to };
      editor.view.dispatch(editor.state.tr);
    } else {
      // 清除之前的选中范围
      selectionRef.current = null;
      editor.view.dispatch(editor.state.tr);
    }

    // 计算位置：如果有选中文本，显示在文本末尾，否则显示在光标位置
    const coords = hasSelection ? 
      editor.view.coordsAtPos(to) : 
      editor.view.coordsAtPos(selection.from);
    
    setPosition({
      x: coords.left,
      y: coords.bottom + 10,
    });

    setIsVisible(true);
  }, [editor]);

  // 暴露方法给外部使用
  useEffect(() => {
    if (!editor) return;
    
    // 将方法挂载到 editor 上，以便外部调用
    editor.aiToolbar = {
      show: showToolbar
    };

    return () => {
      delete editor.aiToolbar;
    };
  }, [editor, showToolbar]);

  const checkSelectionAndUpdatePosition = useCallback(() => {
    if (!editor) return;

    const { state } = editor;
    const { selection } = state;
    const { ranges } = selection;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const hasSelection = !selection.empty;

    if (!hasSelection) {
      setIsVisible(false);
      selectionRef.current = null;
      editor.view.dispatch(editor.state.tr);
      return;
    }

    const node = editor.state.doc.nodeAt(selection.from);
    if (node && (node.type.name === 'customImage' || node.type.name === 'table')) {
      setIsVisible(false);
      selectionRef.current = null;
      editor.view.dispatch(editor.state.tr);
      return;
    }

    const from = Math.min(...ranges.map((range) => range.$from.pos));
    const to = Math.max(...ranges.map((range) => range.$to.pos));
    
    if (from === to) {
      setIsVisible(false);
      selectionRef.current = null;
      editor.view.dispatch(editor.state.tr);
      return;
    }

    // 保存选中范围并触发高亮更新
    selectionRef.current = { from, to };
    editor.view.dispatch(editor.state.tr);

    const coords = editor.view.coordsAtPos(to);
    
    setPosition({
      x: coords.left,
      y: coords.bottom + 10,
    });

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);
  }, [editor]);

  const handleMouseUp = useCallback(() => {
    checkSelectionAndUpdatePosition();
  }, [checkSelectionAndUpdatePosition]);

  useEffect(() => {
    if (!editor) return;
    const editorElement = editor.view.dom;
    editorElement.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      editorElement.removeEventListener('mouseup', handleMouseUp);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editor, handleMouseUp]);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      // 只在没有保存的选中范围时隐藏工具栏
      if (!selectionRef.current) {
        setIsVisible(false);
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor]);

  const handleInsertContent = () => {
    if (!generatedContent) return;

    // 将文本按行分割并转换为节点数组
    const nodes = generatedContent.split('\n').map(line => {
      if (!line.trim()) {
        return {
          type: 'paragraph'
        };
      }
      return {
        type: 'paragraph',
        content: [{
          type: 'text',
          text: line
        }]
      };
    });

    if (selectionRef.current) {
      const { from, to } = selectionRef.current;
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent({
          type: 'doc',
          content: nodes
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'doc',
          content: nodes
        })
        .run();
    }

    // 重置状态
    setGeneratedContent('');
    setIsVisible(false);
    setPrompt('');
    
    // 延迟清除选中范围和高亮，避免递归更新
    setTimeout(() => {
      selectionRef.current = null;
      editor.view.dispatch(editor.state.tr);
    }, 0);
  };

  const handleRegenerate = () => {
    setGeneratedContent('');
    handleSubmit();
  };

  const handleCancel = () => {
    setGeneratedContent('');
    setIsVisible(false);
    setPrompt('');
    selectionRef.current = null;
    editor.view.dispatch(editor.state.tr);
  };

  const handleSubmit = async () => {
    let text = '';
    let insertPosition = { from: 0, to: 0 };
    
    if (selectionRef.current) {
      const { from, to } = selectionRef.current;
      text = editor.state.doc.textBetween(from, to, '\n');
      insertPosition = { from, to };
    } else {
      insertPosition = { 
        from: editor.state.selection.from,
        to: editor.state.selection.from 
      };
    }

    if (!prompt.trim()) {
      alert('请输入提示词');
      return;
    }

    setIsLoading(true);
    onLoadingChange(true);
    setGeneratedContent(''); // 清空之前的内容

    try {
      const response = await fetch('/api/ai/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          prompt: prompt.trim()
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
          setGeneratedContent(prev => prev + lines.join('\n') + '\n');
        }
      }

      // 处理剩余的buffer
      if (buffer) {
        setGeneratedContent(prev => prev + buffer);
      }

    } catch (error: any) {
      console.error('AI 处理出错:', error);
      alert(error.message || 'AI 处理出错，请稍后重试');
    } finally {
      setIsLoading(false);
      onLoadingChange(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <Popover.Root open={isVisible} onOpenChange={handleCancel}>
        <Popover.Trigger asChild>
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
          >
            <Wand2 className="w-4 h-4" />
            AI 助手
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="bg-white rounded-lg shadow-lg border border-gray-200 w-[400px] max-h-[600px] overflow-hidden flex flex-col"
            sideOffset={5}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              e.preventDefault();
            }}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="text-sm font-medium mb-2">
                {selectionRef.current ? '处理选中的文本' : '在此处插入 AI 生成的内容'}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={selectionRef.current ? 
                    "例如：翻译成英文、总结要点、改写为正式语气..." : 
                    "例如：写一段介绍、生成大纲、续写内容..."
                  }
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="p-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {generatedContent && (
              <>
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="text-sm whitespace-pre-wrap">
                    {generatedContent}
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white rounded border border-gray-200 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" />
                    放弃
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-white rounded border border-gray-200 hover:bg-gray-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重新生成
                  </button>
                  <button
                    onClick={handleInsertContent}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                  >
                    <Check className="w-4 h-4" />
                    插入
                  </button>
                </div>
              </>
            )}

            <div className="p-4 text-xs text-gray-500 border-t border-gray-200">
              提示：{selectionRef.current ? 
                "可以输入任何文本处理指令，AI 会智能理解并执行。" : 
                "可以让 AI 生成新内容，或者基于上下文续写。"
              }按下 Alt + / 也可以快速打开 AI 助手。
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}; 
'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Wand2, Send, X, Check, RotateCcw, Loader2 } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { debounce } from 'lodash';

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
        transition: background-color 0.2s ease;
      }
      .ai-processing-highlight:hover {
        background-color: rgba(59, 130, 246, 0.15);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 计算工具栏位置的函数
  const calculatePosition = useCallback((to: number) => {
    if (!editor) return null;

    const coords = editor.view.coordsAtPos(to);
    const editorRect = editor.view.dom.getBoundingClientRect();
    
    // 确保工具栏不会超出编辑器边界
    const x = Math.min(
      Math.max(coords.left, editorRect.left),
      editorRect.right - 400 // 假设工具栏宽度为 400px
    );
    
    const y = Math.min(
      coords.bottom + 10,
      editorRect.bottom - 300 // 假设工具栏最大高度为 300px
    );

    return { x, y };
  }, [editor]);

  // 添加手动触发方法
  const showToolbar = useCallback(() => {
    if (!editor) {
      console.log('showToolbar: editor not available');
      return;
    }

    const { state } = editor;
    const { selection } = state;
    const { empty, ranges } = selection;

    console.log('showToolbar: Selection state:', {
      empty,
      ranges: ranges.map(range => ({
        from: range.$from.pos,
        to: range.$to.pos,
        text: state.doc.textBetween(range.$from.pos, range.$to.pos)
      }))
    });

    let position;
    if (empty) {
      // 如果没有选中内容，使用当前光标位置
      console.log('showToolbar: Using cursor position');
      position = calculatePosition(selection.from);
      // 设置插入位置为当前光标位置
      selectionRef.current = { from: selection.from, to: selection.from };
    } else {
      // 如果有选中内容，检查是否有效
      const from = Math.min(...ranges.map((range) => range.$from.pos));
      const to = Math.max(...ranges.map((range) => range.$to.pos));
      
      if (from === to) {
        console.log('showToolbar: Invalid selection range');
        return;
      }

      // 检查选中的节点类型
      const node = editor.state.doc.nodeAt(from);
      console.log('showToolbar: Selected node type:', node?.type.name);
      
      if (node && (node.type.name === 'customImage' || node.type.name === 'table')) {
        console.log('showToolbar: Invalid node type');
        return;
      }

      // 保存选中范围并触发高亮更新
      selectionRef.current = { from, to };
      editor.view.dispatch(editor.state.tr);
      position = calculatePosition(to);
    }

    // 设置位置并显示工具栏
    if (position) {
      console.log('showToolbar: Setting new position and showing toolbar');
      setPosition(position);
      setIsVisible(true);
    } else {
      console.log('showToolbar: Failed to calculate position');
    }
  }, [editor, calculatePosition]);

  // 暴露方法给外部使用
  useEffect(() => {
    if (!editor) return;
    
    console.log('Registering aiToolbar.show method');
    editor.aiToolbar = {
      show: showToolbar
    };

    return () => {
      console.log('Unregistering aiToolbar.show method');
      delete editor.aiToolbar;
    };
  }, [editor, showToolbar]);

  // 监听滚动事件，更新工具栏位置
  useEffect(() => {
    if (!editor || !isVisible) return;

    const handleScroll = () => {
      if (selectionRef.current) {
        const { to } = selectionRef.current;
        const newPosition = calculatePosition(to);
        if (newPosition) {
          setPosition(newPosition);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    editor.view.dom.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      editor.view.dom.removeEventListener('scroll', handleScroll);
    };
  }, [editor, isVisible, calculatePosition]);

  // 监听选中内容变化，如果选中内容消失则关闭工具栏
  useEffect(() => {
    if (!editor || !isVisible) return;

    const handleSelectionChange = () => {
      const { state } = editor;
      const { selection } = state;
      
      if (selection.empty) {
        handleCancel();
      }
    };

    editor.on('selectionUpdate', handleSelectionChange);
    
    return () => {
      editor.off('selectionUpdate', handleSelectionChange);
    };
  }, [editor, isVisible]);

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
    let isGenerating = false; // 标记是否为生成模式
    
    if (selectionRef.current) {
      const { from, to } = selectionRef.current;
      // 如果 from 和 to 相同，说明是空状态下的光标位置
      if (from === to) {
        isGenerating = true;
        insertPosition = { from, to };
      } else {
        // 有选中内容，获取选中的文本
        text = editor.state.doc.textBetween(from, to, '\n');
        insertPosition = { from, to };
      }
    } else {
      isGenerating = true;
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
          prompt: prompt.trim(),
          mode: isGenerating ? 'generate' : 'process' // 添加模式标记
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
        transform: 'translateY(0)',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
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
                {selectionRef.current && selectionRef.current.from !== selectionRef.current.to
                  ? '处理选中的文本'
                  : '在此处插入 AI 生成的内容'}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={selectionRef.current && selectionRef.current.from !== selectionRef.current.to
                    ? "例如：翻译成英文、总结要点、改写为正式语气..."
                    : "例如：写一段介绍、生成大纲、续写内容..."
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
              提示：{selectionRef.current && selectionRef.current.from !== selectionRef.current.to
                ? "可以输入任何文本处理指令，AI 会智能理解并执行。"
                : "可以让 AI 生成新内容，或者基于上下文续写。"
              }按下 Alt + / 也可以快速打开 AI 助手。
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}; 
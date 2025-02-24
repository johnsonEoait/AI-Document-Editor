'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Wand2, Send } from 'lucide-react';
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectionRef = useRef<{ from: number; to: number } | null>(null);
  const pluginKey = new PluginKey('aiHighlight');
  const [streamContent, setStreamContent] = useState('');

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

    // 在发送请求前就禁用编辑器
    editor.setEditable(false);
    setIsLoading(true);
    onLoadingChange(true);

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

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullContent += decoder.decode(value);
      }

      // 处理内容，移除可能的markdown格式
      const processedContent = fullContent
        .replace(/^```[\s\S]*?```/gm, '') // 移除代码块
        .replace(/`([^`]+)`/g, '$1')      // 移除内联代码
        .replace(/\*\*([^*]+)\*\*/g, '$1') // 移除加粗
        .replace(/\*([^*]+)\*/g, '$1')     // 移除斜体
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 移除链接
        .replace(/#{1,6}\s/g, '')         // 移除标题标记
        .replace(/^\s*[-*+]\s/gm, '')     // 移除列表标记
        .replace(/^\s*\d+\.\s/gm, '')     // 移除有序列表标记
        .trim();

      // 收集完所有内容后，一次性插入
      if (selectionRef.current) {
        editor
          .chain()
          .focus()
          .deleteRange(insertPosition)
          .insertContent(processedContent)
          .run();
      } else {
        editor
          .chain()
          .focus()
          .insertContent(processedContent)
          .run();
      }

    } catch (error: any) {
      console.error('AI 处理出错:', error);
      alert(error.message || 'AI 处理出错，请稍后重试');
    } finally {
      // 恢复编辑器可编辑状态
      editor.setEditable(true);
      setIsLoading(false);
      onLoadingChange(false);
      setIsVisible(false);
      setPrompt('');
      selectionRef.current = null;
      // 清除高亮
      editor.view.dispatch(editor.state.tr);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    selectionRef.current = null;
    // 清除高亮
    editor.view.dispatch(editor.state.tr);
  };

  if (!isVisible) return null;

  return (
    <>
      {isLoading && (
        <div 
          className="fixed inset-0 bg-transparent z-[999]" 
          style={{ cursor: 'not-allowed' }}
          onClick={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
        />
      )}
      <div
        className="fixed z-50"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <Popover.Root open={isVisible} onOpenChange={handleClose}>
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
              className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-[300px]"
              sideOffset={5}
              onOpenAutoFocus={(e) => {
                e.preventDefault();
              }}
              onPointerDownOutside={(e) => {
                // 防止点击外部时清除选中
                e.preventDefault();
              }}
            >
              <div className="space-y-4">
                <div className="text-sm font-medium">
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
                    className="flex-1 px-3 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <Send className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  提示：{selectionRef.current ? 
                    "可以输入任何文本处理指令，AI 会智能理解并执行。" : 
                    "可以让 AI 生成新内容，或者基于上下文续写。"
                  }按下 Alt + / 也可以快速打开 AI 助手。
                </div>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </>
  );
}; 
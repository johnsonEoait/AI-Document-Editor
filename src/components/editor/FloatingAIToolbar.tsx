'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Wand2, Send, X, Check, RotateCcw, Loader2, GripHorizontal } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number }>({
    isDragging: false,
    startX: 0,
    startY: 0
  });

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
        background: linear-gradient(120deg, rgba(96, 165, 250, 0.1), rgba(129, 140, 248, 0.1));
        border-radius: 0.25rem;
        padding: 0.125rem 0;
        border-bottom: 2px solid rgba(96, 165, 250, 0.5);
        transition: all 0.3s ease;
      }
      
      .ai-toolbar-content {
        animation: aiToolbarSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      @keyframes aiToolbarSlideIn {
        from {
          opacity: 0;
          transform: translateY(8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .ai-input-wrapper {
        position: relative;
        transition: all 0.2s ease;
      }
      
      .ai-input-wrapper:focus-within {
        transform: translateY(-1px);
      }
      
      .ai-generated-content {
        position: relative;
        overflow: hidden;
      }
      
      .ai-generated-content::-webkit-scrollbar {
        width: 6px;
      }
      
      .ai-generated-content::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .ai-generated-content::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
      }
      
      .ai-generated-content::-webkit-scrollbar-thumb:hover {
        background-color: rgba(0, 0, 0, 0.2);
      }

      .ai-toolbar-glass {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(0, 0, 0, 0.05);
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.05),
          0 2px 6px rgba(0, 0, 0, 0.03);
      }

      .ai-drag-handle {
        cursor: move;
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
      }

      .ai-drag-handle:hover {
        background-color: rgba(0, 0, 0, 0.03);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 添加拖拽相关的事件处理
  useEffect(() => {
    if (!isVisible) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return;

      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
    };

    const handleMouseUp = () => {
      dragRef.current.isDragging = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isVisible]);

  // 自动聚焦输入框
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

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

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY
    };
    document.body.style.cursor = 'move';
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateY(0)',
        transition: dragRef.current.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="ai-toolbar-content ai-toolbar-glass w-[480px] overflow-hidden flex flex-col rounded-lg">
        <div 
          className="ai-drag-handle flex items-center justify-between px-3 py-1.5 border-b border-gray-100/80"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400 select-none">点击此处拖拽</span>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <div className="ai-input-wrapper flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={selectionRef.current && selectionRef.current.from !== selectionRef.current.to
                ? "翻译/总结/改写..."
                : "写一段/续写..."
              }
              className="flex-1 px-3 py-2 text-sm bg-gray-50/50 rounded-lg border border-gray-200/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/20 placeholder:text-gray-400"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="p-2 text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 min-w-[36px] flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px]">
            <div className="text-gray-400">
              {selectionRef.current && selectionRef.current.from !== selectionRef.current.to
                ? "处理选中的文本"
                : "在此处生成内容"
              }
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100/80 rounded">Alt</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100/80 rounded">/</kbd>
            </div>
          </div>
        </div>

        {generatedContent && (
          <>
            <div className="ai-generated-content flex-1 max-h-[400px] px-3 py-2.5 overflow-y-auto bg-gray-50/50">
              <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {generatedContent}
              </div>
            </div>
            <div className="flex justify-end gap-1.5 p-2 border-t border-gray-100">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 bg-white/80 rounded-md border border-gray-200/50 hover:bg-white hover:border-gray-300/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                取消
              </button>
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 bg-white/80 rounded-md border border-gray-200/50 hover:bg-white hover:border-gray-300/50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重新生成
              </button>
              <button
                onClick={handleInsertContent}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-md hover:from-blue-600 hover:to-blue-700 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                插入
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 
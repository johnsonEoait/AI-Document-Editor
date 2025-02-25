'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Wand2, Send, X, Check, RotateCcw, Loader2, GripHorizontal, Sparkles } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { debounce } from 'lodash';
import './styles/aiToolbar.css';

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
  const [sparkles, setSparkles] = useState<Array<{id: number, x: number, y: number, size: number, delay: number}>>([]);

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
      
      // 添加魔法效果 - 生成随机的闪光点
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 5 + Math.random() * 15,
        delay: Math.random() * 0.5
      }));
      setSparkles(newSparkles);
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

  const handleInsertContent = () => {
    if (!generatedContent) return;

    // HTML 实体解码函数
    const decodeHtmlEntities = (text: string) => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    };

    // 更彻底地清理生成的内容
    let cleanedContent = generatedContent;
    
    // 1. 解码 HTML 实体
    cleanedContent = decodeHtmlEntities(cleanedContent);
    
    // 2. 移除所有 Markdown 标记中的转义反斜杠 - 使用更全面的正则表达式
    cleanedContent = cleanedContent.replace(/\\([\\`*_{}\[\]()#+\-.!|>~=])/g, '$1');
    
    // 3. 特别处理常见的 Markdown 语法
    // 处理加粗和斜体
    cleanedContent = cleanedContent.replace(/\\\*/g, '*');
    cleanedContent = cleanedContent.replace(/\\_/g, '_');
    
    // 处理链接和图片
    cleanedContent = cleanedContent.replace(/\\\[/g, '[');
    cleanedContent = cleanedContent.replace(/\\\]/g, ']');
    cleanedContent = cleanedContent.replace(/\\\(/g, '(');
    cleanedContent = cleanedContent.replace(/\\\)/g, ')');
    
    // 处理代码块
    cleanedContent = cleanedContent.replace(/\\`/g, '`');
    
    // 4. 处理连续的反斜杠
    cleanedContent = cleanedContent.replace(/\\\\/g, '\\');
    
    // 5. 处理特殊的 HTML 标签
    cleanedContent = cleanedContent.replace(/&lt;/g, '<');
    cleanedContent = cleanedContent.replace(/&gt;/g, '>');
    cleanedContent = cleanedContent.replace(/&amp;/g, '&');
    cleanedContent = cleanedContent.replace(/&quot;/g, '"');
    cleanedContent = cleanedContent.replace(/&#39;/g, "'");

    console.log('清理后的内容:', cleanedContent);

    try {
      // 先删除选中的内容
      if (selectionRef.current) {
        const { from, to } = selectionRef.current;
        editor.chain().focus().deleteRange({ from, to }).run();
      }
      
      // 使用 Tiptap 的 insertContent 方法，尝试保留格式
      editor.commands.insertContent(cleanedContent);
    } catch (error) {
      console.error('Error inserting content:', error);
      
      // 如果上述方法失败，尝试最原始的方式：直接插入纯文本
      try {
        // 获取当前光标位置
        const pos = editor.state.selection.from;
        
        // 创建一个新的事务
        const transaction = editor.state.tr;
        
        // 如果有选中内容，先删除
        if (selectionRef.current) {
          const { from, to } = selectionRef.current;
          transaction.delete(from, to);
        }
        
        // 直接插入纯文本
        transaction.insertText(cleanedContent, pos);
        
        // 应用事务
        editor.view.dispatch(transaction);
      } catch (finalError) {
        console.error('All insertion methods failed:', finalError);
        alert('插入内容失败，请重试');
      }
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
    onLoadingChange(false); // 不再使用全屏遮罩
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
        transition: dragRef.current.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* 魔法闪光效果 */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            animationDelay: `${sparkle.delay}s`
          }}
        />
      ))}
      
      <div className="ai-toolbar-content ai-toolbar-glass w-[500px] overflow-hidden flex flex-col rounded-2xl shadow-lg">
        <div 
          className="ai-drag-handle flex items-center justify-between px-4 py-2.5"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600 select-none">AI 助手</span>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {selectionRef.current && selectionRef.current.from !== selectionRef.current.to && (
            <div className="mb-3 px-3 py-2 bg-gray-50/30 rounded-lg border border-gray-100/50 text-xs text-gray-600 max-h-[100px] overflow-y-auto">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-1 h-[calc(100%-2px)] bg-gray-300/50 rounded-full"></div>
                </div>
                <div className="flex-1 line-clamp-4 whitespace-pre-wrap">
                  {editor.state.doc.textBetween(selectionRef.current.from, selectionRef.current.to, '\n')}
                </div>
              </div>
            </div>
          )}
          <div className="ai-input-wrapper flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Wand2 className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={selectionRef.current && selectionRef.current.from !== selectionRef.current.to
                  ? "翻译/总结/改写..."
                  : "写一段/续写..."
                }
                className="magic-input flex-1 pl-10 pr-3 py-3 text-sm rounded-xl w-full focus:outline-none placeholder:text-gray-300"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="magic-btn p-3 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 min-w-[46px] flex items-center justify-center"
              aria-label="发送"
            >
              {isLoading ? (
                <div className="ai-loading-indicator">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px]">
            <div className="text-gray-500 flex items-center gap-1.5">
              {selectionRef.current && selectionRef.current.from !== selectionRef.current.to
                ? "处理选中的文本"
                : "在此处生成内容"
              }
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-50/70 rounded border border-gray-200/70">Alt</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-50/70 rounded border border-gray-200/70">/</kbd>
            </div>
          </div>
        </div>

        {generatedContent && (
          <>
            <div className="ai-generated-content flex-1 max-h-[400px] px-4 py-3 overflow-y-auto">
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {generatedContent}
                {isLoading && <span className="typing-effect">&nbsp;</span>}
              </div>
            </div>
            <div className="flex justify-end gap-2 p-3 border-t border-gray-100/30">
              <button
                onClick={handleCancel}
                className="simple-btn flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="取消"
              >
                <X className="w-3.5 h-3.5" />
                取消
              </button>
              <button
                onClick={handleRegenerate}
                className="simple-btn flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="重新生成"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重新生成
              </button>
              <button
                onClick={handleInsertContent}
                disabled={isLoading}
                className={`magic-btn flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-900 rounded-lg transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="插入"
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
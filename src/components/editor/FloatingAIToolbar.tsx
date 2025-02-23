'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Wand2 } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';

interface FloatingAIToolbarProps {
  editor: Editor;
}

export const FloatingAIToolbar = ({ editor }: FloatingAIToolbarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const checkSelectionAndUpdatePosition = useCallback(() => {
    if (!editor) return;

    const { state } = editor;
    const { selection } = state;
    const { ranges } = selection;

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 检查是否有文本选择
    const hasSelection = !selection.empty;

    if (!hasSelection) {
      setIsVisible(false);
      return;
    }

    // 检查选中的节点类型
    const node = editor.state.doc.nodeAt(selection.from);
    if (node && (node.type.name === 'customImage' || node.type.name === 'table')) {
      setIsVisible(false);
      return;
    }

    // 获取选择范围的坐标
    const from = Math.min(...ranges.map((range) => range.$from.pos));
    const to = Math.max(...ranges.map((range) => range.$to.pos));
    
    if (from === to) {
      setIsVisible(false);
      return;
    }

    const coords = editor.view.coordsAtPos(to);
    
    // 设置位置
    setPosition({
      x: coords.left,
      y: coords.bottom + 10,
    });

    // 延迟200ms后显示工具栏
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);
  }, [editor]);

  // 处理鼠标松开事件
  const handleMouseUp = useCallback(() => {
    checkSelectionAndUpdatePosition();
  }, [checkSelectionAndUpdatePosition]);

  useEffect(() => {
    if (!editor) return;

    // 获取编辑器的 DOM 元素
    const editorElement = editor.view.dom;

    // 监听鼠标松开事件
    editorElement.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      editorElement.removeEventListener('mouseup', handleMouseUp);
      // 清理定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [editor, handleMouseUp]);

  // 在选择变化时隐藏工具栏
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      setIsVisible(false);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor]);

  const aiActions = [
    {
      label: '优化文本',
      action: async () => {
        const selection = editor.state.selection;
        const text = editor.state.doc.textBetween(
          selection.from,
          selection.to,
          '\n'
        );
        
        if (!text) {
          alert('请先选择要优化的文本');
          return;
        }

        setIsLoading(true);
        try {
          const response = await fetch('/api/ai/improve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || data.details || '未知错误');
          }
          
          if (data.text) {
            editor
              .chain()
              .focus()
              .deleteRange({
                from: selection.from,
                to: selection.to,
              })
              .insertContent(data.text)
              .run();
          } else {
            throw new Error('AI 返回的内容为空');
          }
        } catch (error: any) {
          console.error('AI 处理出错:', error);
          alert(error.message || 'AI 处理出错，请稍后重试');
        } finally {
          setIsLoading(false);
          setIsVisible(false);
        }
      },
    },
    {
      label: '扩展内容',
      action: async () => {
        const selection = editor.state.selection;
        const text = editor.state.doc.textBetween(
          selection.from,
          selection.to,
          '\n'
        );
        
        if (!text) {
          alert('请先选择要扩展的文本');
          return;
        }

        setIsLoading(true);
        try {
          const response = await fetch('/api/ai/expand', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || data.details || '未知错误');
          }
          
          if (data.text) {
            editor
              .chain()
              .focus()
              .deleteRange({
                from: selection.from,
                to: selection.to,
              })
              .insertContent(data.text)
              .run();
          } else {
            throw new Error('AI 返回的内容为空');
          }
        } catch (error: any) {
          console.error('AI 处理出错:', error);
          alert(error.message || 'AI 处理出错，请稍后重试');
        } finally {
          setIsLoading(false);
          setIsVisible(false);
        }
      },
    },
    {
      label: '总结内容',
      action: async () => {
        const selection = editor.state.selection;
        const text = editor.state.doc.textBetween(
          selection.from,
          selection.to,
          '\n'
        );
        
        if (!text) {
          alert('请先选择要总结的文本');
          return;
        }

        setIsLoading(true);
        try {
          const response = await fetch('/api/ai/summarize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || data.details || '未知错误');
          }
          
          if (data.text) {
            editor
              .chain()
              .focus()
              .deleteRange({
                from: selection.from,
                to: selection.to,
              })
              .insertContent(data.text)
              .run();
          } else {
            throw new Error('AI 返回的内容为空');
          }
        } catch (error: any) {
          console.error('AI 处理出错:', error);
          alert(error.message || 'AI 处理出错，请稍后重试');
        } finally {
          setIsLoading(false);
          setIsVisible(false);
        }
      },
    },
  ];

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-1">
          {aiActions.map((action, index) => (
            <button
              key={index}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={action.action}
              disabled={isLoading}
            >
              <Wand2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 
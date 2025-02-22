'use client';

import { Editor } from '@tiptap/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Wand2 } from 'lucide-react';
import { useState } from 'react';

interface AIToolbarProps {
  editor: Editor;
}

export const AIToolbar = ({ editor }: AIToolbarProps) => {
  const [isLoading, setIsLoading] = useState(false);

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
        }
      },
    },
  ];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={isLoading}
      >
        <Wand2 className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] bg-white rounded-md shadow-lg p-1"
          sideOffset={5}
        >
          {aiActions.map((action, index) => (
            <DropdownMenu.Item
              key={index}
              className="outline-none select-none rounded px-2 py-2 text-sm cursor-pointer hover:bg-gray-100"
              onClick={action.action}
              disabled={isLoading}
            >
              {action.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}; 
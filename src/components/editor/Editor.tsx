'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';
import { common, createLowlight } from 'lowlight';
import { EditorToolbar } from './Toolbar';
import { FloatingAIToolbar } from './FloatingAIToolbar';
import { BlockMenu } from './BlockMenu';
import { SlashCommands } from './SlashCommands';
import { CustomImage } from './extensions/CustomImage';
import { useState } from 'react';

const lowlight = createLowlight(common);

interface EditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

export const Editor = ({ content = '', onChange, placeholder = '输入 "/" 来插入内容...' }: EditorProps) => {
  const [wordCount, setWordCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Highlight,
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'table'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      CustomImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return '标题'
          }
          return placeholder
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      SlashCommands,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
      const text = editor.state.doc.textContent;
      setWordCount(text.length);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] px-8 py-6',
      },
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
    enableCoreExtensions: true,
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto relative">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between py-4 px-6">
              <h1 className="text-2xl font-bold text-gray-900">AI 文档编辑器</h1>
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                保存文档
              </button>
            </div>
            <div className="border-b">
              <EditorToolbar editor={editor} />
            </div>
          </div>
        </div>
        <div className="pt-[140px] pb-16 min-h-[calc(100vh-180px)] bg-white">
          <div className="relative flex">
            <div className="w-10 flex-shrink-0 relative">
              <BlockMenu editor={editor} />
            </div>
            <div className="flex-1 px-8">
              <EditorContent editor={editor} />
              <FloatingAIToolbar editor={editor} />
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between px-6 py-3 text-sm text-gray-500">
              <div>字数统计：{wordCount}</div>
              <div>最后保存时间：未保存</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
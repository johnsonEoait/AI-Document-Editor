'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { EditorToolbar } from './Toolbar';
import { AIToolbar } from './AIToolbar';
import { SlashCommands } from './SlashCommands';
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
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return '标题'
          }
          return placeholder
        },
        showOnlyWhenEmpty: true,
        showOnlyCurrent: true,
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
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between py-4 px-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">AI 文档编辑器</h1>
          <div className="flex items-center gap-4">
            <AIToolbar editor={editor} />
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              保存文档
            </button>
          </div>
        </div>
        <div className="border-b">
          <EditorToolbar editor={editor} />
        </div>
        <div className="relative min-h-[500px] bg-white">
          <EditorContent editor={editor} />
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t text-sm text-gray-500">
          <div>字数统计：{wordCount}</div>
          <div>最后保存时间：未保存</div>
        </div>
      </div>
    </div>
  );
}; 
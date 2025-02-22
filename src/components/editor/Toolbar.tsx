'use client';

import { Editor } from '@tiptap/react';
import * as Toolbar from '@radix-ui/react-toolbar';
import {
  FontBoldIcon,
  FontItalicIcon,
  StrikethroughIcon,
  CodeIcon,
  QuoteIcon,
  ListBulletIcon,
  ListOrderedIcon,
  LinkIcon,
  ImageIcon,
} from '@radix-ui/react-icons';

interface EditorToolbarProps {
  editor: Editor;
}

export const Toolbar = ({ editor }: EditorToolbarProps) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('输入图片 URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const url = window.prompt('输入链接 URL');
    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <Toolbar.Root className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="加粗"
      >
        <FontBoldIcon />
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="斜体"
      >
        <FontItalicIcon />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="删除线"
      >
        <StrikethroughIcon />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="行内代码"
      >
        <CodeIcon />
      </ToolbarButton>

      <Toolbar.Separator className="w-[1px] bg-gray-300 mx-1 h-6" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="标题 1"
      >
        H1
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="标题 2"
      >
        H2
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="标题 3"
      >
        H3
      </ToolbarButton>

      <Toolbar.Separator className="w-[1px] bg-gray-300 mx-1 h-6" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="无序列表"
      >
        <ListBulletIcon />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="有序列表"
      >
        <ListOrderedIcon />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="引用"
      >
        <QuoteIcon />
      </ToolbarButton>

      <Toolbar.Separator className="w-[1px] bg-gray-300 mx-1 h-6" />

      <ToolbarButton
        onClick={setLink}
        active={editor.isActive('link')}
        title="添加链接"
      >
        <LinkIcon />
      </ToolbarButton>

      <ToolbarButton
        onClick={addImage}
        title="插入图片"
      >
        <ImageIcon />
      </ToolbarButton>
    </Toolbar.Root>
  );
};

interface ToolbarButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  title?: string;
}

const ToolbarButton = ({ onClick, children, active, title }: ToolbarButtonProps) => {
  return (
    <Toolbar.Button
      className={`p-2 rounded hover:bg-gray-200 transition-colors ${
        active ? 'bg-gray-200' : ''
      }`}
      onClick={onClick}
      title={title}
    >
      {children}
    </Toolbar.Button>
  );
}; 
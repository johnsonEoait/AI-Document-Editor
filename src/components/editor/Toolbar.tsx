'use client';

import { Editor } from '@tiptap/react';
import * as Toolbar from '@radix-ui/react-toolbar';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Quote,
  List,
  ListOrdered,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table,
  Underline,
  Highlighter,
  Palette,
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { useRef } from 'react';

interface EditorToolbarProps {
  editor: Editor;
}

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  if (!editor) {
    return null;
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          editor.chain().focus().setImage({ src: result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
    // 清除选择的文件，这样相同的文件可以再次选择
    event.target.value = '';
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

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run();
  };

  return (
    <div className="border-b">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <Toolbar.Root className="flex flex-wrap gap-0.5 p-2">
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="加粗"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="斜体"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="删除线"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="下划线"
          >
            <Underline className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive('highlight')}
            title="高亮"
          >
            <Highlighter className="w-4 h-4" />
          </ToolbarButton>

          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                  editor.isActive('textStyle') ? 'bg-gray-100' : ''
                }`}
                title="文字颜色"
              >
                <Palette className="w-4 h-4" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="bg-white rounded-lg shadow-lg p-2 w-[200px]"
                sideOffset={5}
              >
                <div className="grid grid-cols-5 gap-1">
                  {[
                    '#000000', '#434343', '#666666', '#999999', '#b7b7b7',
                    '#ff1717', '#ff7e00', '#ffdd00', '#00ff00', '#007fff',
                    '#0000ff', '#7337ee', '#ee37d4', '#ff69b4', '#8b4513',
                    '#f44336', '#ff9800', '#ffc107', '#4caf50', '#2196f3',
                  ].map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded-full cursor-pointer border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                      }}
                    />
                  ))}
                </div>
                <button
                  className="w-full mt-2 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                  }}
                >
                  清除颜色
                </button>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="左对齐"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="居中对齐"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="右对齐"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            active={editor.isActive({ textAlign: 'justify' })}
            title="两端对齐"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="无序列表"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="有序列表"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="引用"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={setLink}
            active={editor.isActive('link')}
            title="添加链接"
          >
            <Link className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={addImage}
            title="插入图片"
          >
            <Image className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={addTable}
            title="插入表格"
          >
            <Table className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="行内代码"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>
      </Toolbar.Root>
    </div>
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
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        active ? 'bg-gray-100' : ''
      }`}
      onClick={onClick}
      title={title}
    >
      {children}
    </Toolbar.Button>
  );
};

const ToolbarGroup = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="flex items-center gap-0.5 px-0.5">
        {children}
      </div>
      <Toolbar.Separator className="w-[1px] bg-gray-200 mx-1 h-6" />
    </>
  );
}; 
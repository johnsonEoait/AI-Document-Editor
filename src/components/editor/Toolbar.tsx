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
  RowsIcon,
  ColumnsIcon,
  Trash2,
  Link2,
  Type,
  ChevronDown,
  Text,
  FileDown,
  Save,
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useRef, useState } from 'react';
import { FontSizeSelector } from './components/FontSizeSelector';
import { Toast } from './components/Toast';
import { FindReplace } from './components/FindReplace';

type Level = 1 | 2 | 3 | 4 | 5 | 6;

interface EditorToolbarProps {
  editor: Editor;
  onLinkClick: () => void;
  onSave: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const TableSelector = ({ onSelect }: { onSelect: (rows: number, cols: number) => void }) => {
  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleMouseEnter = (row: number, col: number) => {
    setRows(row);
    setCols(col);
  };

  const handleMouseDown = (row: number, col: number) => {
    setIsSelecting(true);
    setRows(row);
    setCols(col);
  };

  const handleMouseUp = () => {
    if (isSelecting) {
      setIsSelecting(false);
      onSelect(rows + 1, cols + 1);
    }
  };

  return (
    <div className="p-2">
      <div className="mb-2">
        <div 
          className="grid grid-cols-8 gap-1"
          onMouseLeave={() => {
            if (!isSelecting) {
              setRows(0);
              setCols(0);
            }
          }}
        >
          {Array.from({ length: 8 * 8 }).map((_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const isActive = row <= rows && col <= cols;
            return (
              <div
                key={i}
                className={`w-4 h-4 border transition-colors ${
                  isActive ? 'bg-blue-500 border-blue-600' : 'border-gray-200'
                }`}
                onMouseEnter={() => handleMouseEnter(row, col)}
                onMouseDown={() => handleMouseDown(row, col)}
                onMouseUp={handleMouseUp}
              />
            );
          })}
        </div>
      </div>
      <div className="text-sm text-gray-500 text-center">
        {rows > 0 || cols > 0 ? `${rows + 1} × ${cols + 1} 表格` : '拖动选择表格大小'}
      </div>
    </div>
  );
};

export const EditorToolbar = ({ editor, onLinkClick, onSave }: EditorToolbarProps) => {
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
          editor.chain()
            .insertContent({
              type: 'customImage',
              attrs: { src: result }
            })
            .run();
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

  const handleSave = async () => {
    try {
      // 获取编辑器的内容
      const content = editor.getJSON();
      
      // 检查 localStorage 是否可用
      if (typeof window !== 'undefined' && window.localStorage) {
        // 将内容保存到 localStorage
        localStorage.setItem('editor-content', JSON.stringify({
          content,
          title: editor.getText().split('\n')[0] || '未命名文档', // 使用第一行文本作为标题
          lastSaved: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
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
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-0.5 p-2 rounded hover:bg-gray-100 transition-colors">
                <Type className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                className="bg-white rounded-lg shadow-lg py-1.5 min-w-[180px] border border-gray-200"
                sideOffset={5}
              >
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <DropdownMenu.Item
                    key={level}
                    className="flex items-center px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer outline-none"
                    onClick={() => editor.chain().focus().toggleHeading({ level: level as Level }).run()}
                  >
                    <span 
                      className={`${editor.isActive('heading', { level: level as Level }) ? 'font-medium text-blue-600' : ''}`}
                      style={{ 
                        fontSize: `${level === 1 ? '1.1em' : level === 2 ? '1.05em' : '1em'}`,
                        fontWeight: level <= 2 ? 500 : 400
                      }}
                    >
                      标题 {level}
                    </span>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <FontSizeSelector editor={editor} />
        </ToolbarGroup>

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
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                  editor.isActive('highlight') ? 'bg-gray-100' : ''
                }`}
                title="背景色"
              >
                <Highlighter className="w-4 h-4" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="bg-white rounded-lg shadow-lg p-2 w-[200px]"
                sideOffset={5}
              >
                <div className="grid grid-cols-5 gap-1">
                  {[
                    '#ffeb3b', '#ffd700', '#ffa500', '#ff7f50', '#ff1493',
                    '#90ee90', '#98fb98', '#00fa9a', '#00ffff', '#87ceeb',
                    '#e6e6fa', '#dda0dd', '#ee82ee', '#da70d6', '#ffc0cb',
                    '#f0e68c', '#deb887', '#d2b48c', '#bc8f8f', '#f5f5f5',
                  ].map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded cursor-pointer border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().toggleHighlight({ color }).run();
                      }}
                    />
                  ))}
                </div>
                <button
                  className="w-full mt-2 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                  onClick={() => {
                    editor.chain().focus().unsetHighlight().run();
                  }}
                >
                  清除背景色
                </button>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

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
                    '#0000ff', '#7337ee', '#ee37d4', '#c71585', '#8b4513',
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
            onClick={onLinkClick}
            active={editor.isActive('link')}
            title="添加链接"
          >
            <Link2 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={addImage}
            title="插入图片"
          >
            <Image className="w-4 h-4" />
          </ToolbarButton>

          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                  editor.isActive('table') ? 'bg-gray-100' : ''
                }`}
                title="插入表格"
              >
                <Table className="w-4 h-4" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="bg-white rounded-lg shadow-lg"
                sideOffset={5}
              >
                <TableSelector
                  onSelect={(rows, cols) => {
                    editor
                      .chain()
                      .focus()
                      .deleteRange(editor.state.selection)
                      .insertTable({ 
                        rows,
                        cols,
                        withHeaderRow: true 
                      })
                      .run();
                  }}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="行内代码"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            onClick={(e) => onSave(e)}
            title="导出文档"
          >
            <FileDown className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={(e) => onSave(e)}
            title="保存文档"
          >
            <Save className="w-4 h-4" />
          </ToolbarButton>
          <FindReplace editor={editor} />
        </ToolbarGroup>
      </Toolbar.Root>
    </div>
  );
};

interface ToolbarButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}

const ToolbarButton = ({ onClick, active, title, children }: ToolbarButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        active ? 'bg-gray-100' : ''
      }`}
      title={title}
    >
      {children}
    </button>
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
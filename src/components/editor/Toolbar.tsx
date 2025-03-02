'use client';

import React, { useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import * as Toolbar from '@radix-ui/react-toolbar';
import * as Popover from '@radix-ui/react-popover';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
  Type,
  ChevronDown,
  Text,
  FileDown,
  Save,
  Wand2,
  FileText,
  BookmarkIcon,
  Link2
} from 'lucide-react';
import { Heading4, Heading5, Heading6 } from './icons/HeadingIcons';
import { FontSizeSelector } from './FontSizeSelector';
import { FindReplace } from './FindReplace';

// 导入重构后的组件和工具
import { ToolbarButton } from './components/ToolbarButton';
import { ToolbarGroup } from './components/ToolbarGroup';
import { TableSelector } from './components/TableSelector';
import { HeadingSelector } from './components/HeadingSelector';
import { ColorPicker } from './components/ColorPicker';
import { CitationForm } from './components/CitationForm';
import { EditorToolbarProps, CitationData, HeadingLevel } from './types/toolbar';
import { isFormatActive, getActiveHeadingLevel, insertCitation, isCommandEnabled } from './utils/toolbarUtils';
import { TEXT_COLORS, BACKGROUND_COLORS, TOOLBAR_ICONS, TOOLBAR_GROUPS } from './constants/toolbarConstants';

export const EditorToolbar = ({ 
  editor, 
  onLinkClick, 
  onSave, 
  onTocClick, 
  showToc, 
  onSetTitleFromH1 
}: EditorToolbarProps) => {
  if (!editor) {
    return null;
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentHeadingLevel, setCurrentHeadingLevel] = useState<HeadingLevel | null>(null);

  // 更新当前标题级别
  React.useEffect(() => {
    if (editor) {
      const level = getActiveHeadingLevel(editor);
      setCurrentHeadingLevel(level);
    }
  }, [editor.state]);

  // 处理图片上传
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

  // 处理链接设置
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

  // 处理标题选择
  const handleHeadingSelect = (level: HeadingLevel) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  // 处理引用文献插入
  const handleCitationInsert = (data: CitationData) => {
    insertCitation(editor, data);
  };

  // 处理文本颜色选择
  const handleTextColorSelect = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  // 处理背景颜色选择
  const handleBgColorSelect = (color: string) => {
    editor.chain().focus().toggleHighlight({ color }).run();
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
      <Toolbar.Root className="flex flex-nowrap gap-0.5 p-2 overflow-x-auto whitespace-nowrap">
        {/* 目录按钮 */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={onTocClick}
            active={showToc}
            title="目录"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </ToolbarButton>

          {/* 标题选择器 */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button className="flex items-center gap-0.5 p-2 rounded hover:bg-gray-100 transition-colors">
                <Type className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content 
                className="bg-white rounded-lg shadow-lg z-[100] border border-gray-200"
                sideOffset={5}
              >
                <HeadingSelector 
                  onSelect={handleHeadingSelect}
                  currentLevel={currentHeadingLevel}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          <FontSizeSelector editor={editor} />
        </ToolbarGroup>

        {/* 文本格式工具栏 */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={isFormatActive(editor, 'bold')}
            title="加粗"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={isFormatActive(editor, 'italic')}
            title="斜体"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={isFormatActive(editor, 'strike')}
            title="删除线"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={isFormatActive(editor, 'underline')}
            title="下划线"
          >
            <Underline className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* 颜色工具栏 */}
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
                className="bg-white rounded-lg shadow-lg p-2 w-[200px] z-[100]"
                sideOffset={5}
              >
                <ColorPicker 
                  colors={BACKGROUND_COLORS}
                  onSelectColor={handleBgColorSelect}
                  onClearColor={() => editor.chain().focus().unsetHighlight().run()}
                  title="背景颜色"
                />
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
                className="bg-white rounded-lg shadow-lg p-2 w-[200px] z-[100]"
                sideOffset={5}
              >
                <ColorPicker 
                  colors={TEXT_COLORS}
                  onSelectColor={handleTextColorSelect}
                  onClearColor={() => editor.chain().focus().unsetColor().run()}
                  title="文字颜色"
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </ToolbarGroup>

        {/* 对齐方式工具栏 */}
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

        {/* 列表和引用工具栏 */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={isFormatActive(editor, 'bulletList')}
            title="无序列表"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={isFormatActive(editor, 'orderedList')}
            title="有序列表"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={isFormatActive(editor, 'blockquote')}
            title="引用"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>

          <Popover.Root>
            <Popover.Trigger asChild>
              <button 
                className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                  editor.isActive('blockquote') ? 'bg-gray-100' : ''
                }`}
                title="引用文献"
              >
                <BookmarkIcon className="w-4 h-4" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content 
                className="bg-white rounded-lg shadow-lg border border-gray-200 z-[100]"
                sideOffset={5}
              >
                <CitationForm 
                  onInsert={handleCitationInsert}
                  onCancel={() => {}}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </ToolbarGroup>

        {/* 插入工具栏 */}
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
                className="bg-white rounded-lg shadow-lg z-[100]"
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
            active={isFormatActive(editor, 'code')}
            title="行内代码"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* 工具和保存工具栏 */}
        <ToolbarGroup>
          <ToolbarButton
            onClick={() => {
              if (editor.aiToolbar?.show) {
                editor.aiToolbar.show();
              }
            }}
            title="AI 助手 (Alt + /)"
          >
            <Wand2 className="w-4 h-4" />
          </ToolbarButton>
          {onSetTitleFromH1 && (
            <ToolbarButton
              onClick={() => onSetTitleFromH1()}
              title="将当前一级标题设为文档标题"
            >
              <FileText className="w-4 h-4" />
            </ToolbarButton>
          )}
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
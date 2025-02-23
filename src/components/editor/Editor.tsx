'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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
import { TextSelection } from 'prosemirror-state';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { JSONContent } from '@tiptap/react';
import { EditorToolbar } from './Toolbar';
import { FloatingAIToolbar } from './FloatingAIToolbar';
import { SlashCommands } from './SlashCommands';
import { TableMenu } from './TableMenu';
import { TableQuickButtons } from './TableQuickButtons';
import { CustomImage } from './extensions/CustomImage';
import { CustomHighlight } from './extensions/CustomHighlight';
import { FontSize } from './extensions/FontSize';
import { InlineLinkEditor } from './InlineLinkEditor';
import { useState, useCallback, useEffect } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip, ShadingType } from 'docx';
import mammoth from 'mammoth';
import debounce from 'lodash/debounce';
import htmlDocx from 'html-docx-js/dist/html-docx';

const lowlight = createLowlight(common);

interface TextRunWithSize extends TextRun {
  size?: number;
}

interface SavedContent {
  content: JSONContent;
  html: string;
  lastSaved: string;
  title: string;
}

interface EditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

export const Editor = ({ content = '', onChange, placeholder = '输入 "/" 来插入内容...' }: EditorProps) => {
  const [wordCount, setWordCount] = useState(0);
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string>('未保存');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [dialogPosition, setDialogPosition] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [title, setTitle] = useState<string>('未命名文档');

  // 从本地存储加载内容
  const loadSavedContent = useCallback((): SavedContent | null => {
    try {
      // 检查 localStorage 是否可用
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedData = localStorage.getItem('editor-content');
        if (savedData) {
          return JSON.parse(savedData) as SavedContent;
        }
      }
    } catch (error) {
      console.error('加载保存的内容失败:', error);
    }
    return null;
  }, []);

  // 使用 useEffect 来加载保存的内容
  useEffect(() => {
    const savedData = loadSavedContent();
    if (savedData?.title) {
      setTitle(savedData.title);
    }
  }, [loadSavedContent]);

  // 创建防抖的自动保存函数
  const debouncedAutoSave = useCallback(
    debounce((editor: ReturnType<typeof useEditor>) => {
      if (!editor) return;
      
      try {
        const content = editor.getJSON();
        const html = editor.getHTML();
        localStorage.setItem('editor-content', JSON.stringify({
          content,
          html,
          title,
          lastSaved: new Date().toISOString()
        }));
        setLastSaveTime(new Date().toLocaleTimeString());
        setToast({ message: '已自动保存', type: 'success' });
        
        // 3秒后清除提示
        setTimeout(() => {
          setToast(null);
        }, 3000);
      } catch (error) {
        console.error('自动保存失败:', error);
        setToast({ message: '自动保存失败', type: 'error' });
      }
    }, 2000), // 2秒的防抖延迟
    [title]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      CustomHighlight,
      TextStyle,
      Color,
      FontSize,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'table'],
      }),
      Table.configure({
        resizable: true,
        allowTableNodeSelection: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full relative',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'group/row relative border-b border-gray-200',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2 bg-gray-50 font-bold group-hover/row:bg-gray-100/50 transition-colors',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2 relative group-hover/row:bg-gray-100/50 transition-colors',
        },
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
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
    content: loadSavedContent()?.html || content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
      const text = editor.state.doc.textContent;
      setWordCount(text.length);
      
      // 触发自动保存
      debouncedAutoSave(editor);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] px-8 py-6',
      },
      handleClick: (view, pos, event) => {
        const { state } = view;
        const { doc } = state;
        
        // 获取编辑器的DOM元素
        const editorElement = view.dom as HTMLElement;
        const editorRect = editorElement.getBoundingClientRect();
        
        // 获取点击的坐标
        const mouseY = event.clientY;
        
        // 找到最后一个块级节点
        let lastBlockNode: ProsemirrorNode | null = null;
        let lastBlockPos = 0;
        
        doc.descendants((node: ProsemirrorNode, pos) => {
          if (node.isBlock) {
            lastBlockNode = node;
            lastBlockPos = pos;
          }
        });
        
        if (!lastBlockNode) return false;
        
        // 获取最后一个块的DOM元素和位置
        const lastBlockElement = view.nodeDOM(lastBlockPos) as HTMLElement;
        if (!lastBlockElement) return false;
        
        const lastBlockRect = lastBlockElement.getBoundingClientRect();
        
        // 检查点击是否在最后一个块的下方
        if (mouseY > lastBlockRect.bottom) {
          // 检查最后一个节点是否为空段落
          const isEmpty = lastBlockNode.type.name === 'paragraph' && lastBlockNode.content.size === 0;
          
          if (!isEmpty) {
            // 在文档末尾插入新的空段落
            const tr = view.state.tr.insert(
              doc.content.size,
              state.schema.nodes.paragraph.create()
            );
            
            // 将光标移动到新段落
            const newPos = doc.content.size;
            tr.setSelection(TextSelection.create(tr.doc, newPos));
            
            view.dispatch(tr);
            view.focus();
            return true;
          }
        }
        return false;
      },
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
    enableCoreExtensions: true,
  });

  // 设置最后保存时间
  useEffect(() => {
    if (loadSavedContent()?.lastSaved) {
      const date = new Date(loadSavedContent()!.lastSaved);
      setLastSaveTime(date.toLocaleTimeString());
    }
  }, [loadSavedContent]);

  const handleSave = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!editor) return;
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDialogPosition({
      x: buttonRect.right + 8,
      y: buttonRect.top - 8
    });
    setIsConfirmDialogOpen(true);
  }, [editor]);

  const handleConfirmSave = useCallback(() => {
    if (!editor) return;
    
    // 处理文档标题
    const documentTitle = title.trim() || '未命名文档';
    
    // 获取编辑器的HTML内容
    const html = editor.getHTML();
    
    // 创建一个包含完整HTML文档的字符串
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${documentTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 2cm; }
            table { border-collapse: collapse; width: 100%; margin: 1em 0; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f5f5f5; }
            h1 { font-size: 24pt; margin-top: 1em; margin-bottom: 0.5em; }
            h2 { font-size: 18pt; margin-top: 1em; margin-bottom: 0.5em; }
            h3 { font-size: 14pt; margin-top: 1em; margin-bottom: 0.5em; }
            p { margin: 1em 0; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-justify { text-align: justify; }
            img { max-width: 100%; height: auto; }
            a { color: #0066cc; text-decoration: underline; }
            blockquote { border-left: 3px solid #ddd; margin: 1em 0; padding-left: 1em; }
            code { background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px; }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    try {
      // 使用 html-docx-js 将 HTML 转换为 docx
      const converted = htmlDocx.asBlob(fullHtml);
      
      // 创建下载链接
      const url = URL.createObjectURL(converted);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentTitle}.docx`;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      
      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // 更新保存时间
      setLastSaveTime(new Date().toLocaleTimeString());
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('导出文档失败:', error);
      setToast({ message: '导出失败，请重试', type: 'error' });
    }
  }, [editor, title]);

  const handleLinkClick = useCallback(() => {
    if (!editor) return;
    
    const { state } = editor;
    const { selection } = state;
    const hasSelection = !selection.empty;

    if (hasSelection) {
      setIsLinkEditorOpen(true);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {toast.message}
        </div>
      )}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmDialogOpen(false)}
        position={dialogPosition ?? undefined}
      />
      <div className="max-w-5xl mx-auto relative">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between py-4 px-6">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (editor) {
                    debouncedAutoSave(editor);
                  }
                }}
                className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                placeholder="输入文档标题"
              />
            </div>
            <div className="border-b">
              <EditorToolbar 
                editor={editor} 
                onLinkClick={handleLinkClick}
                onSave={handleSave}
              />
            </div>
          </div>
        </div>
        <div className="pt-[140px] pb-16 min-h-[calc(100vh-180px)] bg-white">
          <div className="relative">
            <div className="relative">
              <EditorContent editor={editor} />
              <TableMenu editor={editor} />
              <TableQuickButtons editor={editor} />
              {!isLinkEditorOpen && <FloatingAIToolbar editor={editor} />}
              <InlineLinkEditor
                editor={editor}
                isOpen={isLinkEditorOpen}
                onClose={() => setIsLinkEditorOpen(false)}
              />
            </div>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-sm">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between px-6 py-3 text-sm text-gray-500">
              <div>字数统计：{wordCount}</div>
              <div>最后保存时间：{lastSaveTime}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
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
import { CustomImage } from './CustomImage';
import { CustomHighlight } from './CustomHighlight';
import { FontSize } from './FontSize';
import { InlineLinkEditor } from './InlineLinkEditor';
import { useState, useCallback, useEffect } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import htmlDocx from 'html-docx-js/dist/html-docx';
import debounce from 'lodash/debounce';

const lowlight = createLowlight(common);

interface SavedContent {
  content: JSONContent;
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

  // 创建通用的保存函数
  const saveContent = useCallback((editor: ReturnType<typeof useEditor>, isAuto = false) => {
    if (!editor) return;
    
    try {
      const content = editor.getJSON();
      localStorage.setItem('editor-content', JSON.stringify({
        content,
        title,
        lastSaved: new Date().toISOString()
      }));
      setLastSaveTime(new Date().toLocaleTimeString());
      setToast({ 
        message: isAuto ? '已自动保存' : '文档已保存', 
        type: 'success' 
      });
      
      // 3秒后清除提示
      setTimeout(() => {
        setToast(null);
      }, 3000);
    } catch (error) {
      console.error('保存失败:', error);
      setToast({ message: '保存失败，请重试', type: 'error' });
    }
  }, [title]);

  // 创建防抖的自动保存函数
  const debouncedAutoSave = useCallback(
    debounce((editor: ReturnType<typeof useEditor>) => {
      saveContent(editor, true);
    }, 2000),
    [saveContent]
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
    content: loadSavedContent()?.content || content,
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
      handleKeyDown: (view, event) => {
        // 检查是否按下了 Ctrl+F
        if (event.ctrlKey && event.key === 'f') {
          // 阻止浏览器默认的查找行为
          event.preventDefault();
          // 触发查找替换按钮的点击事件
          const findReplaceButton = document.querySelector('[title="查找和替换"]') as HTMLButtonElement;
          if (findReplaceButton) {
            findReplaceButton.click();
            return true;
          }
        }
        return false;
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
    
    // 如果点击的是导出按钮
    if (event.currentTarget.title === '导出文档') {
      const buttonRect = event.currentTarget.getBoundingClientRect();
      setDialogPosition({
        x: buttonRect.right + 8,
        y: buttonRect.top - 8
      });
      setIsConfirmDialogOpen(true);
    } else {
      // 如果是保存按钮，直接保存
      saveContent(editor);
    }
  }, [editor, saveContent]);

  const handleConfirmSave = useCallback(() => {
    if (!editor) return;
    
    // 处理文档标题
    const documentTitle = title.trim() || '未命名文档';
    
    // 获取编辑器的HTML内容
    const content = editor.getHTML();
    
    // 添加基本样式
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="zh">
      <head>
        <meta charset="UTF-8">
        <title>${documentTitle}</title>
        <style>
          body {
            font-family: "Microsoft YaHei", sans-serif;
            line-height: 1.6;
            margin: 1in;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
          }
          th {
            background-color: #f5f5f5;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          blockquote {
            border-left: 4px solid #ddd;
            margin: 1em 0;
            padding-left: 1em;
            color: #666;
          }
          pre {
            background-color: #f5f5f5;
            padding: 1em;
            border-radius: 4px;
            overflow-x: auto;
          }
          code {
            background-color: #f5f5f5;
            padding: 0.2em 0.4em;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    // 转换为Word文档
    const docx = htmlDocx.asBlob(htmlContent);
    
    // 创建下载链接
    const url = window.URL.createObjectURL(docx);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentTitle}.docx`;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // 更新保存时间
    setLastSaveTime(new Date().toLocaleTimeString());
    setIsConfirmDialogOpen(false);
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
          className={`fixed top-4 right-4 px-3 py-2 rounded-md shadow-lg z-[9999] ${
            toast.type === 'success' ? 'bg-black text-white' : 'bg-white text-black'
          } flex items-center space-x-2 transition-all duration-300 transform translate-y-0 opacity-100 text-sm border ${
            toast.type === 'success' ? 'border-gray-700' : 'border-gray-200'
          }`}
          style={{
            animation: 'slideIn 0.3s ease-out',
            boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span>{toast.message}</span>
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
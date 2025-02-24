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
import { Node as ProsemirrorNode } from '@tiptap/pm/model';
import { JSONContent } from '@tiptap/react';
import { Markdown } from 'tiptap-markdown';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { EditorToolbar } from './Toolbar';
import { FloatingAIToolbar } from './FloatingAIToolbar';
import { SlashCommands } from './SlashCommands';
import { CustomImage } from './CustomImage';
import { CustomHighlight } from './CustomHighlight';
import { FontSize } from './FontSize';
import { InlineLinkEditor } from './InlineLinkEditor';
import { useState, useCallback, useEffect } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import htmlDocx from 'html-docx-js/dist/html-docx';
import debounce from 'lodash/debounce';
import { BlockHandle } from './extensions/BlockHandle';
import { TableMenu } from './TableMenu';
import { AIShortcut } from './extensions/AIShortcut';
import './styles/editor.css';

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
  const [isEditorDisabled, setIsEditorDisabled] = useState(false);

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
          levels: [1, 2, 3, 4, 5, 6],
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-gray-300 pl-4 my-4',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-outside ml-4',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-outside ml-4',
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: 'my-2',
          },
        },
      }),
      BlockHandle.configure({
        HTMLAttributes: {
          class: 'block-handle',
        },
      }),
      Markdown.configure({
        transformPastedText: true,
        transformCopiedText: true,
        html: false,
        breaks: true,
      }),
      Table.configure({
        HTMLAttributes: {
          class: 'markdown-table',
        },
        resizable: false,
        handleWidth: 0,
        cellMinWidth: 100,
        lastColumnResizable: false,
        allowTableNodeSelection: false,
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: '',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: '',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: '',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CustomHighlight,
      TextStyle,
      Color,
      FontSize,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'table'],
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
      AIShortcut,
    ],
    content: loadSavedContent()?.content || content,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange?.(markdown);
      const text = editor.state.doc.textContent;
      setWordCount(text.length);
      
      // 触发自动保存
      debouncedAutoSave(editor);
    },
    editable: true,
    injectCSS: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] px-8 py-6 markdown-body relative',
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

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === '/' || e.key === '？')) {
        e.preventDefault();
        // 如果有选中的文本，显示 AI 工具栏
        if (editor.state.selection.content().size > 0 && editor.aiToolbar?.show) {
          editor.aiToolbar.show();
        }
      }
    };

    // 添加事件监听器
    editor.view.dom.addEventListener('keydown', handleKeyDown);

    return () => {
      // 移除事件监听器
      editor.view.dom.removeEventListener('keydown', handleKeyDown);
    };
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
      <div className="max-w-5xl mx-auto relative editor-container">
        {/* 全屏遮罩层 */}
        {isEditorDisabled && (
          <div 
            className="fixed inset-0 z-[999] overflow-hidden editor-disabled-overlay"
            style={{ cursor: 'not-allowed' }}
          >
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-[4px] animate-gradient-xy" />
            
            {/* 动态光效 */}
            <div className="absolute inset-0">
              <div className="absolute w-[800px] h-[800px] bg-blue-200/30 rounded-full blur-3xl animate-blob" 
                style={{ top: '10%', left: '15%' }} 
              />
              <div className="absolute w-[700px] h-[700px] bg-purple-200/30 rounded-full blur-3xl animate-blob animation-delay-2000" 
                style={{ top: '40%', right: '15%' }} 
              />
              <div className="absolute w-[750px] h-[750px] bg-pink-200/30 rounded-full blur-3xl animate-blob animation-delay-4000" 
                style={{ bottom: '15%', left: '35%' }} 
              />
            </div>

            {/* AI 处理中提示 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-8 py-6 rounded-2xl bg-white/80 backdrop-blur-xl shadow-2xl transform hover:scale-105 transition-all duration-500">
                <div className="flex items-center gap-4">
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-1 border-3 border-purple-400 border-t-transparent rounded-full animate-spin animation-delay-150" />
                  </div>
                  <span className="text-gray-700 font-medium text-lg">AI 创作中...</span>
                </div>
              </div>
            </div>
          </div>
        )}
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
            <div className="relative pl-[60px]">
              <EditorContent 
                editor={editor}
                className="editor-content relative"
              />
              {!isLinkEditorOpen && (
                <FloatingAIToolbar 
                  editor={editor} 
                  onLoadingChange={setIsEditorDisabled}
                />
              )}
              <InlineLinkEditor
                editor={editor}
                isOpen={isLinkEditorOpen}
                onClose={() => setIsLinkEditorOpen(false)}
              />
              <TableMenu editor={editor} />
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
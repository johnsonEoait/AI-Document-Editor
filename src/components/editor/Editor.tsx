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
import { SlashCommands } from './utils/SlashCommands';
import { CustomImage } from './utils/CustomImage';
import { CustomHighlight } from './utils/CustomHighlight';
import { FontSize } from './utils/FontSize';
import { InlineLinkEditor } from './InlineLinkEditor';
import { useState, useCallback, useEffect } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, BorderStyle, ISectionOptions, IStylesOptions } from 'docx';
import debounce from 'lodash/debounce';
import { BlockHandle } from './BlockHandle';
import { TableMenu } from './TableMenu';
import { AIShortcut } from './utils/AIShortcut';
import { ToastNotification } from './ToastNotification';
import { EditorOverlay } from './EditorOverlay';
import { TableOfContents } from './TableOfContents';
import { EditorHeader } from './EditorHeader';
import { EditorFooter } from './EditorFooter';
import { exportToDocx, downloadFile } from './utils/documentExport';
import { generateTableOfContents, generateTitle } from './utils/editorUtils';
import { loadSavedContent, saveContent } from './utils/editorStorage';
import { EditorProps, ToastMessage, TableOfContentsItem, DialogPosition } from './types/editor';
import './styles/editor.css';

const lowlight = createLowlight(common);

interface SavedContent {
  content: JSONContent;
  lastSaved: string;
  title: string;
}

interface DocumentSection extends ISectionOptions {
  children: (Paragraph | DocxTable)[];
}

export const Editor = ({ 
  content = '', 
  onChange, 
  placeholder = '输入 "/" 来插入内容...',
  autoUpdateTitleFromH1 = false // 默认不自动更新标题
}: EditorProps) => {
  const [wordCount, setWordCount] = useState(0);
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string>('未保存');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [dialogPosition, setDialogPosition] = useState<DialogPosition | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [title, setTitle] = useState<string>('未命名文档');
  const [showToc, setShowToc] = useState(false);
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);
  const [isEditorDisabled, setIsEditorDisabled] = useState(false);

  // 使用 useEffect 来加载保存的内容
  useEffect(() => {
    const savedData = loadSavedContent();
    if (savedData?.title) {
      setTitle(savedData.title);
    }
  }, []);

  // 更新目录的函数
  const updateTableOfContents = useCallback((editor: any) => {
    if (!editor) return;
    const headings = generateTableOfContents(editor);
    setTableOfContents(headings);
  }, []);

  // 创建防抖的自动保存函数
  const debouncedAutoSave = useCallback(
    debounce((editor: ReturnType<typeof useEditor>) => {
      if (!editor) return;
      saveContent(editor, title, true, setLastSaveTime, setToast);
    }, 2000),
    [title]
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
      // 注释掉 BlockHandle 的配置，保留引用但不使用其功能
      // BlockHandle.configure({
      //   HTMLAttributes: {
      //     class: 'block-handle',
      //   },
      // }),
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
      // 使用 setTimeout 来避免递归调用
      setTimeout(() => {
        const markdown = editor.storage.markdown.getMarkdown();
        onChange?.(markdown);
        const text = editor.state.doc.textContent;
        setWordCount(text.length);
        
        // 只有当 autoUpdateTitleFromH1 为 true 时，才自动更新标题
        if (autoUpdateTitleFromH1) {
          // 获取第一个节点的文本作为标题
          const firstNode = editor.state.doc.firstChild;
          if (firstNode && firstNode.type.name === 'heading' && firstNode.attrs.level === 1) {
            setTitle(firstNode.textContent);
          }
        }
        
        // 每次内容更新时都更新目录
        updateTableOfContents(editor);
        
        // 触发自动保存
        debouncedAutoSave(editor);
      }, 0);
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
    const savedData = loadSavedContent();
    if (savedData?.lastSaved) {
      const date = new Date(savedData.lastSaved);
      setLastSaveTime(date.toLocaleTimeString());
    }
  }, []);

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
      saveContent(editor, title, false, setLastSaveTime, setToast);
    }
  }, [editor, title]);

  const handleConfirmSave = useCallback(async (includeTitle: boolean = false) => {
    if (!editor) return;
    
    try {
      // 导出为 docx
      const blob = await exportToDocx(editor, title, includeTitle);
      
      // 下载文件
      downloadFile(blob, `${title.trim() || '未命名文档'}.docx`);
      
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

  // 修改目录生成函数
  const handleGenerateTocAndTitle = useCallback(() => {
    if (!editor) return;
    
    // 切换目录显示状态
    setShowToc(!showToc);
    
    // 不管目录是否显示，都更新目录内容
    updateTableOfContents(editor);
    
    // 显示提示
    setToast({
      message: !showToc ? '已显示目录' : '已隐藏目录',
      type: 'success'
    });
  }, [editor, showToc, updateTableOfContents]);

  // 初始化目录内容和标题
  useEffect(() => {
    if (editor && showToc) {
      updateTableOfContents(editor);
    }
  }, [editor, showToc, updateTableOfContents]);

  // 修改标题输入框的onChange处理
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle || '未命名文档');
    
    // 保存标题到本地存储
    if (editor) {
      debouncedAutoSave(editor);
    }
  }, [editor, debouncedAutoSave]);

  // 添加从当前一级标题设置文档标题的函数
  const handleSetTitleFromH1 = useCallback(() => {
    if (!editor) return;
    
    // 查找第一个一级标题
    let h1Text = '';
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === 'heading' && node.attrs.level === 1) {
        h1Text = node.textContent;
        return false; // 找到第一个就停止
      }
    });
    
    if (h1Text) {
      setTitle(h1Text);
      // 显示提示
      setToast({
        message: '已将一级标题设为文档标题',
        type: 'success'
      });
      // 保存到本地存储
      debouncedAutoSave(editor);
    } else {
      // 如果没有找到一级标题，显示提示
      setToast({
        message: '未找到一级标题',
        type: 'error'
      });
    }
  }, [editor, debouncedAutoSave]);

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
      <ToastNotification toast={toast} />
      
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirmSave}
        onCancel={() => setIsConfirmDialogOpen(false)}
        position={dialogPosition ?? undefined}
      />
      
      <EditorOverlay isVisible={isEditorDisabled} />
      
      <div className="max-w-7xl mx-auto relative editor-container">
        <EditorHeader
          title={title}
          onTitleChange={handleTitleChange}
          editor={editor}
          onLinkClick={handleLinkClick}
          onSave={handleSave}
          onTocClick={handleGenerateTocAndTitle}
          showToc={showToc}
          onSetTitleFromH1={handleSetTitleFromH1}
        />
        
        <div className="pt-[140px] pb-16 min-h-[calc(100vh-180px)] bg-white">
          <div className="relative max-w-5xl mx-auto">
            <TableOfContents
              isVisible={showToc}
              onClose={() => setShowToc(false)}
              tableOfContents={tableOfContents}
              editor={editor}
            />
            
            {/* 主编辑区域 */}
            <div className="px-6">
              <EditorContent 
                editor={editor}
                className="editor-content relative prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[calc(100vh-280px)]"
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
        
        <EditorFooter
          wordCount={wordCount}
          lastSaveTime={lastSaveTime}
        />
      </div>
    </div>
  );
}; 
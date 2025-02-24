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

// 修改生成目录的辅助函数
const generateTableOfContents = (editor: any) => {
  const headings: { level: number; text: string }[] = [];
  let isFirstHeading = true;
  
  editor.state.doc.descendants((node: any) => {
    if (node.type.name === 'heading') {
      // 跳过第一个标题（文档标题）
      if (isFirstHeading) {
        isFirstHeading = false;
        return;
      }
      headings.push({
        level: node.attrs.level,
        text: node.textContent
      });
    }
  });
  return headings;
};

const generateTitle = (content: string): string => {
  // 提取第一段非空文本作为标题
  const firstParagraph = content.split('\n').find(p => p.trim().length > 0);
  return firstParagraph?.slice(0, 50) || '未命名文档';
};

export const Editor = ({ content = '', onChange, placeholder = '输入 "/" 来插入内容...' }: EditorProps) => {
  const [wordCount, setWordCount] = useState(0);
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string>('未保存');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [dialogPosition, setDialogPosition] = useState<{ x: number; y: number } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [title, setTitle] = useState<string>('未命名文档');
  const [showToc, setShowToc] = useState(false);
  const [tableOfContents, setTableOfContents] = useState<{ level: number; text: string }[]>([]);

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

  // 更新目录的函数
  const updateTableOfContents = useCallback((editor: any) => {
    const headings: { level: number; text: string }[] = [];
    let isFirstHeading = true;
    
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === 'heading') {
        // 跳过第一个标题（文档标题）
        if (isFirstHeading) {
          isFirstHeading = false;
          return;
        }
        // 只添加非空的标题到目录中
        if (node.textContent.trim()) {
          headings.push({
            level: node.attrs.level,
            text: node.textContent
          });
        }
      }
    });
    
    // 直接更新目录状态
    setTableOfContents(headings);
  }, []);

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
      }),
      BlockHandle,
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
    ],
    content: loadSavedContent()?.content || content,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onChange?.(markdown);
      const text = editor.state.doc.textContent;
      setWordCount(text.length);
      
      // 获取第一个节点的文本作为标题
      const firstNode = editor.state.doc.firstChild;
      if (firstNode && firstNode.type.name === 'heading' && firstNode.attrs.level === 1) {
        setTitle(firstNode.textContent);
      }
      
      // 每次内容更新时都更新目录
      updateTableOfContents(editor);
      
      // 如果第一个节点不是标题，自动将其转换为标题
      if (firstNode && firstNode.type.name !== 'heading') {
        const content = firstNode.textContent;
        editor.chain()
          .focus()
          .setTextSelection(0)
          .deleteRange({ from: 0, to: firstNode.nodeSize })
          .setNode('heading', { level: 1 })
          .insertContent(content)
          .run();
      }
      
      // 触发自动保存
      debouncedAutoSave(editor);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[500px] px-8 py-6 markdown-body',
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
        
        // 找到点击位置最近的节点
        let clickedNode = null;
        let clickedPos = -1;
        
        doc.nodesBetween(0, doc.content.size, (node, pos) => {
          if (node.isBlock) {
            const dom = view.nodeDOM(pos) as HTMLElement;
            if (dom) {
              const rect = dom.getBoundingClientRect();
              if (mouseY >= rect.top && mouseY <= rect.bottom + 20) { // 添加一些额外的点击区域
                clickedNode = node;
                clickedPos = pos;
                return false; // 停止遍历
              }
            }
          }
          return true;
        });
        
        // 如果点击位置在最后一个块的下方
        if (!clickedNode) {
          const lastChild = doc.lastChild;
          if (lastChild) {
            const lastPos = doc.content.size - lastChild.nodeSize;
            const lastDom = view.nodeDOM(lastPos) as HTMLElement;
            
            if (lastDom) {
              const lastRect = lastDom.getBoundingClientRect();
              
              if (mouseY > lastRect.bottom) {
                // 检查最后一个节点是否为空段落
                const isEmptyParagraph = lastChild.type.name === 'paragraph' && lastChild.content.size === 0;
                
                if (!isEmptyParagraph) {
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
            }
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

  // 修改输入框的onChange处理
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle || '未命名文档');
    
    // 更新文档中的第一个一级标题
    if (editor) {
      // 获取文档的第一个节点
      const firstNode = editor.state.doc.firstChild;
      
      if (firstNode) {
        // 如果第一个节点是一级标题，更新它
        if (firstNode.type.name === 'heading' && firstNode.attrs.level === 1) {
          editor.chain().focus().setTextSelection(0).deleteRange({ from: 0, to: firstNode.nodeSize }).run();
          editor.chain().focus().setNode('heading', { level: 1 }).insertContent(newTitle).run();
        } else {
          // 如果第一个节点不是一级标题，在开头插入新标题，并保持原有内容
          const fragment = editor.state.doc.content;
          editor.chain()
            .focus()
            .clearContent()
            .setNode('heading', { level: 1 })
            .insertContent(newTitle)
            .insertContent({ type: 'paragraph' }) // 插入一个空段落作为分隔
            .insertContent(fragment)
            .run();
        }
      } else {
        // 如果文档为空，直接插入标题和一个空段落
        editor.chain()
          .focus()
          .setNode('heading', { level: 1 })
          .insertContent(newTitle)
          .insertContent({ type: 'paragraph' })
          .run();
      }
      
      debouncedAutoSave(editor);
    }
  }, [editor, debouncedAutoSave]);

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
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between py-4 px-6">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                placeholder="输入文档标题"
              />
            </div>
            <div className="border-b">
              <EditorToolbar 
                editor={editor} 
                onLinkClick={handleLinkClick}
                onSave={handleSave}
                onTocClick={handleGenerateTocAndTitle}
                showToc={showToc}
              />
            </div>
          </div>
        </div>
        <div className="pt-[140px] pb-16 min-h-[calc(100vh-180px)] bg-white">
          <div className="relative max-w-5xl mx-auto">
            {showToc && (
              <div className="absolute" style={{ left: '-380px', width: '250px' }}>
                <div className="bg-gray-50 rounded-lg sticky top-[140px] mt-[38px]">
                  <div className="px-4 py-4">
                    <div className="text-xl font-bold mb-4 break-words">{title}</div>
                    <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto">
                      {tableOfContents.map((heading, index) => {
                        // 计算编号
                        let prefix = '';
                        let parentStack = [];
                        let currentCount = 1;
                        
                        // 向前查找同级标题的数量
                        for (let i = 0; i < index; i++) {
                          const prevHeading = tableOfContents[i];
                          
                          if (prevHeading.level < heading.level) {
                            // 遇到上级标题，更新父级栈
                            while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= prevHeading.level) {
                              parentStack.pop();
                            }
                            parentStack.push({
                              level: prevHeading.level,
                              number: i + 1
                            });
                            currentCount = 1;
                          } else if (prevHeading.level === heading.level) {
                            // 同级标题，计数加1
                            currentCount++;
                          }
                        }
                        
                        // 生成编号
                        if (parentStack.length > 0) {
                          prefix = parentStack.map(p => p.number).join('.') + '.' + currentCount;
                        } else {
                          prefix = currentCount + '.';
                        }
                        
                        return (
                          <div
                            key={index}
                            className="cursor-pointer hover:text-blue-600 text-base py-1 truncate flex items-center gap-0.5"
                            style={{ paddingLeft: `${(heading.level - 1) * 1}rem` }}
                            onClick={() => {
                              const text = heading.text;
                              let pos = 0;
                              editor.state.doc.descendants((node: any, nodePos: number) => {
                                if (node.type.name === 'heading' && node.textContent === text) {
                                  pos = nodePos;
                                  return false;
                                }
                              });
                              editor.commands.setTextSelection(pos);
                              editor.commands.scrollIntoView();
                            }}
                          >
                            <span 
                              className="inline-block" 
                              style={{ 
                                width: heading.level === 1 ? '1.25rem' : heading.level === 2 ? '2rem' : '2.5rem'
                              }}
                            >
                              {prefix}
                            </span>
                            <span className="truncate">{heading.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="px-6">
              <EditorContent 
                editor={editor}
                className="editor-content relative prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[calc(100vh-280px)]"
              />
              {!isLinkEditorOpen && <FloatingAIToolbar editor={editor} />}
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
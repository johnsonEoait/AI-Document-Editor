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
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, BorderStyle, ISectionOptions, IStylesOptions } from 'docx';
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

interface DocumentSection extends ISectionOptions {
  children: (Paragraph | DocxTable)[];
}

// 修改生成目录的辅助函数
const generateTableOfContents = (editor: any) => {
  const headings: { level: number; text: string }[] = [];
  
  editor.state.doc.descendants((node: any) => {
    if (node.type.name === 'heading' && node.textContent.trim()) {
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

  // 更新目录的函数
  const updateTableOfContents = useCallback((editor: any) => {
    const headings: { level: number; text: string }[] = [];
    
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === 'heading' && node.textContent.trim()) {
        headings.push({
          level: node.attrs.level,
          text: node.textContent
        });
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
      // 使用 setTimeout 来避免递归调用
      setTimeout(() => {
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

  const handleConfirmSave = useCallback(async () => {
    if (!editor) return;
    
    // 处理文档标题
    const documentTitle = title.trim() || '未命名文档';
    
    try {
      // 将编辑器内容转换为 docx 格式
      const content = editor.getJSON();
      const children: Paragraph[] = [
        new Paragraph({
          text: documentTitle,
          heading: HeadingLevel.HEADING_1,
          spacing: {
            after: 200
          }
        })
      ];

      // 递归处理内容
      const processTextRun = (child: any): TextRun => {
        if (child.type === 'text') {
          const textStyle: any = {
            text: child.text || '',
          };

          // 辅助函数：处理颜色转换
          const processColor = (inputColor: string): string => {
            let color = inputColor;
            // 如果是 RGB 格式，转换为十六进制
            if (color.startsWith('rgb')) {
              const rgb = color.match(/\d+/g);
              if (rgb && rgb.length >= 3) {
                color = '#' + rgb.slice(0, 3).map((x: string) => 
                  parseInt(x).toString(16).padStart(2, '0')
                ).join('');
              }
            }
            // 移除 # 号
            color = color.replace('#', '');
            // 确保是6位十六进制
            if (color.length === 3) {
              color = color.split('').map((c: string) => c + c).join('');
            }
            // 确保颜色值是小写的
            return color.toLowerCase();
          };

          // 处理文本标记
          if (child.marks) {
            // 处理加粗
            if (child.marks.some((mark: any) => mark.type === 'bold')) {
              textStyle.bold = true;
            }

            // 处理斜体
            if (child.marks.some((mark: any) => mark.type === 'italic')) {
              textStyle.italics = true;
            }

            // 处理下划线
            if (child.marks.some((mark: any) => mark.type === 'underline')) {
              textStyle.underline = {};
            }

            // 处理删除线
            if (child.marks.some((mark: any) => mark.type === 'strike')) {
              textStyle.strike = true;
            }

            // 处理文本颜色
            const colorMark = child.marks.find((mark: any) => mark.type === 'textStyle' && mark.attrs.color);
            if (colorMark && colorMark.attrs.color) {
              const color = processColor(colorMark.attrs.color);
              if (color) {
                textStyle.color = color;
              }
            }

            // 处理背景色
            const textStyleMark = child.marks.find((mark: any) => mark.type === 'textStyle' && mark.attrs.backgroundColor);
            console.log('检查文本节点:', {
              文本内容: child.text,
              所有标记: child.marks,
              文本样式标记: textStyleMark
            });

            if (textStyleMark && textStyleMark.attrs.backgroundColor) {
              const color = processColor(textStyleMark.attrs.backgroundColor);
              console.log('处理背景色:', {
                原始颜色: textStyleMark.attrs.backgroundColor,
                处理后颜色: color,
                标记类型: textStyleMark.type,
                完整标记: textStyleMark
              });
              
              // 将十六进制颜色映射到 docx 支持的高亮颜色
              const getHighlightColor = (hexColor: string): string => {
                // docx 支持的高亮颜色
                const highlightColors: { [key: string]: string } = {
                  'yellow': 'ffff00',
                  'green': '00ff00',
                  'cyan': '00ffff',
                  'magenta': 'ff00ff',
                  'blue': '0000ff',
                  'red': 'ff0000',
                  'darkBlue': '000080',
                  'darkCyan': '008080',
                  'darkGreen': '008000',
                  'darkMagenta': '800080',
                  'darkRed': '800000',
                  'darkYellow': '808000',
                  'darkGray': '808080',
                  'lightGray': 'c0c0c0',
                  'black': '000000'
                };

                // 找到最接近的颜色
                let minDistance = Infinity;
                let closestColor = 'yellow'; // 默认黄色

                const r = parseInt(hexColor.slice(0, 2), 16);
                const g = parseInt(hexColor.slice(2, 4), 16);
                const b = parseInt(hexColor.slice(4, 6), 16);

                for (const [name, hex] of Object.entries(highlightColors)) {
                  const r2 = parseInt(hex.slice(0, 2), 16);
                  const g2 = parseInt(hex.slice(2, 4), 16);
                  const b2 = parseInt(hex.slice(4, 6), 16);

                  const distance = Math.sqrt(
                    Math.pow(r - r2, 2) + 
                    Math.pow(g - g2, 2) + 
                    Math.pow(b - b2, 2)
                  );

                  if (distance < minDistance) {
                    minDistance = distance;
                    closestColor = name;
                  }
                }

                return closestColor;
              };

              if (color) {
                // 使用最接近的预定义高亮颜色
                const highlightColor = getHighlightColor(color);
                textStyle.highlight = highlightColor;
                
                console.log('设置的最终文本样式:', JSON.stringify(textStyle, null, 2));
              }
            }

            // 处理字体大小
            const fontSizeMark = child.marks.find((mark: any) => mark.type === 'textStyle' && mark.attrs.fontSize);
            if (fontSizeMark) {
              // 将像素值转换为磅值
              const sizeInPt = Math.round(parseInt(fontSizeMark.attrs.fontSize) * 0.75);
              textStyle.size = sizeInPt * 2; // docx 使用 half-points
            }
          }

          return new TextRun(textStyle);
        }
        return new TextRun({ text: '' });
      };

      const processNode = (node: any): Paragraph | Paragraph[] | null => {
        if (node.type === 'paragraph') {
          return new Paragraph({
            children: node.content?.map(processTextRun) || [],
            style: node.attrs?.textAlign ? node.attrs.textAlign : undefined,
            spacing: {
              before: 200,
              after: 200
            }
          });
        } else if (node.type === 'heading') {
          const headingLevels = {
            1: HeadingLevel.HEADING_1,
            2: HeadingLevel.HEADING_2,
            3: HeadingLevel.HEADING_3,
            4: HeadingLevel.HEADING_4,
            5: HeadingLevel.HEADING_5,
            6: HeadingLevel.HEADING_6
          };
          return new Paragraph({
            children: node.content?.map(processTextRun) || [],
            heading: headingLevels[node.attrs.level as keyof typeof headingLevels],
            style: node.attrs?.textAlign ? node.attrs.textAlign : undefined,
          });
        } else if (node.type === 'bulletList') {
          return node.content?.map((item: any) => {
            const listItemContent = item.content?.[0]?.content?.map(processTextRun) || [];
            return new Paragraph({
              children: listItemContent,
              bullet: {
                level: 0
              },
              style: item.attrs?.textAlign ? item.attrs.textAlign : undefined,
              spacing: {
                before: 100,
                after: 100
              }
            });
          }) || [];
        } else if (node.type === 'orderedList') {
          return node.content?.map((item: any) => {
            const listItemContent = item.content?.[0]?.content?.map(processTextRun) || [];
            return new Paragraph({
              children: listItemContent,
              numbering: {
                reference: 'default-numbering',
                level: 0
              },
              style: item.attrs?.textAlign ? item.attrs.textAlign : undefined,
              spacing: {
                before: 100,
                after: 100
              }
            });
          }) || [];
        }
        return null;
      };

      // 处理所有节点
      content.content?.forEach((node: any) => {
        const processed = processNode(node);
        if (Array.isArray(processed)) {
          children.push(...processed);
        } else if (processed) {
          children.push(processed);
        }
      });

      // 创建文档
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Microsoft YaHei',
                size: 24,
              },
              paragraph: {
                spacing: {
                  line: 360,
                },
              },
            },
          },
        },
        numbering: {
          config: [{
            reference: 'default-numbering',
            levels: [{
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: 'start',
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 }
                }
              }
            }]
          }]
        },
        sections: [{
          properties: {},
          children
        }]
      });

      // 生成文档
      const buffer = await Packer.toBuffer(doc);
      
      // 创建 Blob
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
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
      <div className="max-w-7xl mx-auto relative editor-container">
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
          <div className="max-w-7xl mx-auto">
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
            {/* 左侧目录 - 绝对定位 */}
            <div className={`fixed transition-all duration-300 ease-in-out ${showToc ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`} 
                 style={{ 
                   left: 'max(24px, calc((100vw - 1280px - 640px) / 2))', 
                   top: '140px', 
                   width: '280px',
                   maxWidth: 'calc((100vw - 1280px) / 2 - 24px)'
                 }}>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">目录</div>
                    <button
                      onClick={() => setShowToc(false)}
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      aria-label="关闭目录"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="px-1 py-2">
                  <div className="space-y-0.5 max-h-[calc(100vh-240px)] overflow-y-auto">
                    {tableOfContents.map((heading, index) => {
                      // 计算编号
                      let prefix = '';
                      let parentStack = [];
                      let currentCount = 1;
                      
                      // 向前查找同级标题的数量
                      for (let i = 0; i < index; i++) {
                        const prevHeading = tableOfContents[i];
                        
                        if (prevHeading.level < heading.level) {
                          while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= prevHeading.level) {
                            parentStack.pop();
                          }
                          parentStack.push({
                            level: prevHeading.level,
                            number: i + 1
                          });
                          currentCount = 1;
                        } else if (prevHeading.level === heading.level) {
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
                          className="group relative cursor-pointer text-[13px] leading-6 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                          style={{ 
                            paddingLeft: `${(heading.level - 1) * 1.25 + 0.75}rem`,
                            paddingRight: '0.75rem',
                          }}
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
                          <div className="flex items-center py-1 gap-1.5">
                            <span className="text-gray-400 min-w-[1.5rem] text-right">
                              {prefix}
                            </span>
                            <span className="truncate flex-1">{heading.text}</span>
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {tableOfContents.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        暂无目录内容
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
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
import { BlockMenu } from './BlockMenu';
import { SlashCommands } from './SlashCommands';
import { TableMenu } from './TableMenu';
import { TableQuickButtons } from './TableQuickButtons';
import { CustomImage } from './extensions/CustomImage';
import { CustomHighlight } from './extensions/CustomHighlight';
import { FontSize } from './extensions/FontSize';
import { InlineLinkEditor } from './InlineLinkEditor';
import { useState, useCallback, useEffect } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  convertInchesToTwip,
  ShadingType
} from 'docx';
import debounce from 'lodash/debounce';

const lowlight = createLowlight(common);

interface TextRunWithSize extends TextRun {
  size?: number;
}

interface SavedContent {
  content: JSONContent;
  lastSaved: string;
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

  // 从本地存储加载内容
  const loadSavedContent = (): SavedContent | null => {
    try {
      const savedData = localStorage.getItem('editor-content');
      if (savedData) {
        const parsed = JSON.parse(savedData) as SavedContent;
        return parsed;
      }
    } catch (error) {
      console.error('加载保存的内容失败:', error);
    }
    return null;
  };

  const savedData = loadSavedContent();

  // 创建防抖的自动保存函数
  const debouncedAutoSave = useCallback(
    debounce((editor: ReturnType<typeof useEditor>) => {
      if (!editor) return;
      
      try {
        const content = editor.getJSON();
        localStorage.setItem('editor-content', JSON.stringify({
          content,
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
    []
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
    content: savedData?.content || content,
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
    if (savedData?.lastSaved) {
      const date = new Date(savedData.lastSaved);
      setLastSaveTime(date.toLocaleTimeString());
    }
  }, []);

  const handleSave = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!editor) return;
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDialogPosition({
      x: buttonRect.right + 8, // 在按钮右边留8px的间距
      y: buttonRect.top - 8 // 稍微向上偏移8px
    });
    setIsConfirmDialogOpen(true);
  }, [editor]);

  const handleConfirmSave = useCallback(() => {
    if (!editor) return;
    
    // 解析编辑器内容
    const processNode = (node: any): Paragraph[] => {
      const paragraphs: Paragraph[] = [];
      
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        const children: TextRun[] = [];
        
        node.content?.forEach((child: any) => {
          if (child.text) {
            const style: any = {
              text: child.text,
              size: 24, // 默认字体大小为12pt (24半磅)
            };
            
            // 处理文本样式
            if (child.marks) {
              child.marks.forEach((mark: any) => {
                switch (mark.type) {
                  case 'bold':
                    style.bold = true;
                    break;
                  case 'italic':
                    style.italics = true;
                    break;
                  case 'underline':
                    style.underline = true;
                    break;
                  case 'strike':
                    style.strike = true;
                    break;
                  case 'textStyle':
                    if (mark.attrs.color) {
                      style.color = mark.attrs.color;
                    }
                    if (mark.attrs.backgroundColor) {
                      style.shading = {
                        type: ShadingType.SOLID,
                        color: mark.attrs.backgroundColor,
                        fill: mark.attrs.backgroundColor
                      };
                    }
                    if (mark.attrs.fontSize) {
                      // 将像素值转换为半磅值 (1pt = 2 half-points)
                      const px = parseFloat(mark.attrs.fontSize);
                      style.size = Math.round((px / 1.333333) * 2);
                    }
                    break;
                }
              });
            }
            
            children.push(new TextRun(style));
          }
        });

        const paragraphStyle: any = {
          children,
          spacing: {
            before: 240, // 12pt = 240 twentieths of a point
            after: 240,
            line: 360, // 18pt = 360 twentieths of a point
          },
          indent: {
            firstLine: 480, // 24pt = 480 twentieths of a point
          }
        };

        // 处理对齐方式
        if (node.attrs.textAlign) {
          switch (node.attrs.textAlign) {
            case 'left':
              paragraphStyle.alignment = AlignmentType.LEFT;
              break;
            case 'center':
              paragraphStyle.alignment = AlignmentType.CENTER;
              break;
            case 'right':
              paragraphStyle.alignment = AlignmentType.RIGHT;
              break;
            case 'justify':
              paragraphStyle.alignment = AlignmentType.JUSTIFIED;
              break;
          }
        }

        // 处理标题级别
        if (node.type.name === 'heading') {
          paragraphStyle.heading = HeadingLevel.HEADING_1 + (node.attrs.level - 1);
          // 设置标题的字体大小
          switch (node.attrs.level) {
            case 1:
              children.forEach(run => (run as TextRunWithSize).size = 64); // 32pt
              break;
            case 2:
              children.forEach(run => (run as TextRunWithSize).size = 56); // 28pt
              break;
            case 3:
              children.forEach(run => (run as TextRunWithSize).size = 48); // 24pt
              break;
          }
          // 标题不需要首行缩进
          delete paragraphStyle.indent;
        }

        paragraphs.push(new Paragraph(paragraphStyle));
      }
      
      // 递归处理子节点
      if (node.content) {
        node.content.forEach((child: any) => {
          paragraphs.push(...processNode(child));
        });
      }
      
      return paragraphs;
    };

    // 创建新的Word文档
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children: processNode(editor.state.doc),
      }],
    });

    // 生成docx文件
    Packer.toBlob(doc).then(blob => {
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${new Date().toISOString().slice(0,10)}.docx`;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      
      // 清理
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // 更新保存时间
      setLastSaveTime(new Date().toLocaleTimeString());
      setIsConfirmDialogOpen(false);
    });
  }, [editor]);

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
              <h1 className="text-2xl font-bold text-gray-900">AI 文档编辑器</h1>
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
          <div className="relative flex">
            <div className="w-10 flex-shrink-0 relative">
              <BlockMenu editor={editor} />
            </div>
            <div className="flex-1 px-8">
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
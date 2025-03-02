'use client';

import { Editor } from '@tiptap/react';
import { CitationData } from '../types/toolbar';

/**
 * 检查编辑器是否支持特定命令
 */
export const isCommandEnabled = (editor: Editor, command: string): boolean => {
  if (!editor) return false;
  
  switch (command) {
    case 'bold':
    case 'italic':
    case 'underline':
    case 'strike':
    case 'code':
      return editor.can().chain().focus()[command]().run();
    case 'bulletList':
    case 'orderedList':
      return editor.can().chain().focus().toggleList(command, 'listItem').run();
    case 'blockquote':
    case 'codeBlock':
      return editor.can().chain().focus().toggleNode(command, 'paragraph').run();
    case 'heading':
      return editor.can().chain().focus().toggleHeading({ level: 1 }).run();
    case 'horizontalRule':
      return editor.can().chain().focus().setHorizontalRule().run();
    case 'hardBreak':
      return editor.can().chain().focus().setHardBreak().run();
    case 'undo':
      return editor.can().chain().undo().run();
    case 'redo':
      return editor.can().chain().redo().run();
    case 'table':
      return editor.can().chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    default:
      return false;
  }
};

/**
 * 检查特定格式是否处于激活状态
 */
export const isFormatActive = (editor: Editor, format: string): boolean => {
  if (!editor) return false;
  
  switch (format) {
    case 'bold':
    case 'italic':
    case 'underline':
    case 'strike':
    case 'code':
    case 'bulletList':
    case 'orderedList':
    case 'blockquote':
    case 'codeBlock':
      return editor.isActive(format);
    default:
      return false;
  }
};

/**
 * 获取当前激活的标题级别
 */
export const getActiveHeadingLevel = (editor: Editor): number | null => {
  if (!editor) return null;
  
  for (let i = 1; i <= 6; i++) {
    if (editor.isActive('heading', { level: i })) {
      return i;
    }
  }
  
  return 0; // 普通文本
};

/**
 * 插入引用文献
 */
export const insertCitation = (editor: Editor, data: CitationData): void => {
  if (!editor) return;
  
  const { author, source, content } = data;
  let citationText = '';
  
  if (content) {
    citationText += `"${content}" `;
  }
  
  if (author) {
    citationText += `- ${author}, `;
  }
  
  citationText += source;
  
  editor
    .chain()
    .focus()
    .toggleNode('blockquote', 'paragraph')
    .insertContent(citationText)
    .run();
}; 
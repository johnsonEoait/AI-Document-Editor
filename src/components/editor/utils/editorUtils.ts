import { Editor } from '@tiptap/react';
import { TableOfContentsItem } from '../types/editor';

// 生成目录
export const generateTableOfContents = (editor: Editor): TableOfContentsItem[] => {
  const headings: TableOfContentsItem[] = [];
  
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

// 生成标题
export const generateTitle = (content: string): string => {
  // 提取第一段非空文本作为标题
  const firstParagraph = content.split('\n').find(p => p.trim().length > 0);
  return firstParagraph?.slice(0, 50) || '未命名文档';
};

// 下载文件
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // 触发下载
  document.body.appendChild(a);
  a.click();
  
  // 清理
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}; 
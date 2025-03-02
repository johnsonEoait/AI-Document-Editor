import { Editor } from '@tiptap/react';
import React from 'react';

// 编辑器工具栏属性接口
export interface EditorToolbarProps {
  editor: Editor;
  onLinkClick: () => void;
  onSave: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onTocClick: () => void;
  showToc: boolean;
  onSetTitleFromH1?: () => void;
}

// 工具栏按钮属性接口
export interface ToolbarButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}

// 表格选择器属性接口
export interface TableSelectorProps {
  onSelect: (rows: number, cols: number) => void;
}

// 标题级别类型
export type HeadingLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// 标题选项接口
export interface HeadingOption {
  level: HeadingLevel;
  label: string;
  className: string;
}

// 颜色选择器属性接口
export interface ColorPickerProps {
  colors: Array<{ color: string; className: string }>;
  onSelectColor: (color: string) => void;
  onClearColor: () => void;
  title?: string;
}

// 引用数据接口
export interface CitationData {
  author: string;
  source: string;
  content: string;
} 
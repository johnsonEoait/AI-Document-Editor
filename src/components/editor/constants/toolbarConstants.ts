'use client';

// 文本颜色选项
export const TEXT_COLORS = [
  { color: 'default', className: 'text-black' },
  { color: 'gray', className: 'text-gray-500' },
  { color: 'red', className: 'text-red-500' },
  { color: 'orange', className: 'text-orange-500' },
  { color: 'yellow', className: 'text-yellow-500' },
  { color: 'green', className: 'text-green-500' },
  { color: 'blue', className: 'text-blue-500' },
  { color: 'purple', className: 'text-purple-500' },
  { color: 'pink', className: 'text-pink-500' },
];

// 背景颜色选项
export const BACKGROUND_COLORS = [
  { color: 'default', className: 'bg-transparent' },
  { color: 'gray', className: 'bg-gray-100' },
  { color: 'red', className: 'bg-red-100' },
  { color: 'orange', className: 'bg-orange-100' },
  { color: 'yellow', className: 'bg-yellow-100' },
  { color: 'green', className: 'bg-green-100' },
  { color: 'blue', className: 'bg-blue-100' },
  { color: 'purple', className: 'bg-purple-100' },
  { color: 'pink', className: 'bg-pink-100' },
];

// 工具栏按钮图标名称
export const TOOLBAR_ICONS = {
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strike: 'Strikethrough',
  code: 'Code',
  bulletList: 'List',
  orderedList: 'ListOrdered',
  blockquote: 'Quote',
  codeBlock: 'FileCode',
  heading: 'Heading',
  horizontalRule: 'Minus',
  hardBreak: 'CornerDownRight',
  undo: 'Undo',
  redo: 'Redo',
  table: 'Table',
  textColor: 'Palette',
  backgroundColor: 'Droplet',
  link: 'Link',
  image: 'Image',
  citation: 'BookOpen',
  clear: 'X',
};

// 工具栏分组
export const TOOLBAR_GROUPS = {
  HISTORY: 'history',
  FORMAT: 'format',
  PARAGRAPH: 'paragraph',
  INSERT: 'insert',
  STYLE: 'style',
}; 
import { Editor } from '@tiptap/react';

/**
 * 计算AI工具栏的位置
 * @param editor 编辑器实例
 * @param position 位置点
 * @returns 计算后的位置坐标
 */
export const calculateToolbarPosition = (editor: Editor, position: number) => {
  if (!editor) return null;

  const coords = editor.view.coordsAtPos(position);
  const editorRect = editor.view.dom.getBoundingClientRect();
  
  // 确保工具栏不会超出编辑器边界
  const x = Math.min(
    Math.max(coords.left, editorRect.left),
    editorRect.right - 400 // 假设工具栏宽度为 400px
  );
  
  const y = Math.min(
    coords.bottom + 10,
    editorRect.bottom - 300 // 假设工具栏最大高度为 300px
  );

  return { x, y };
};

/**
 * 创建闪光效果
 * @returns 闪光效果数组
 */
export const createSparkleEffects = () => {
  return Array.from({ length: 8 }, (_, i) => ({
    id: Date.now() + i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 5 + Math.random() * 15,
    delay: Math.random() * 0.5
  }));
}; 